// GET /admin/export/leads | /admin/export/bookings → .xlsx download.
// Optional query params (all validated against allow-lists in lib/admin-export.js):
//   from, to   created date range, inclusive, interpreted in IST (YYYY-MM-DD)
//   status     one status value
//   service    leads only: leads that include this service
//   col        repeated; which columns to include (default: all)
// Admin only: proxy.js gates /admin/*, and this handler re-checks the admin session
// and reads through the Session_Client so RLS still applies.
import ExcelJS from "exceljs";
import { getAdminSession } from "@/lib/server/admin-session";
import { EXPORT_TYPES, istDayStart, istNextDayStart, parseExportParams } from "@/lib/admin-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH = 1000;
const MAX_ROWS = 50000;

const IST = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short",
});

const TIMESTAMP_COLUMNS = new Set(["created_at", "callback_deadline"]);

function cell(column, value) {
  if (value === null || value === undefined) return "";
  if (TIMESTAMP_COLUMNS.has(column)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : IST.format(d);
  }
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

export async function GET(request, { params }) {
  const session = await getAdminSession();
  if (session.status === "unauthenticated") return new Response("Unauthorized", { status: 401 });
  if (session.status !== "ok") return new Response("Forbidden", { status: 403 });

  const { type } = await params;
  const spec = Object.hasOwn(EXPORT_TYPES, type) ? EXPORT_TYPES[type] : null;
  if (!spec) return new Response("Not found", { status: 404 });

  const { from, to, status, service, columns } = parseExportParams(type, request.nextUrl.searchParams);

  // package_title is derived from the embed; every other export column is a real database column.
  const dbColumns = columns.map((c) => c.key).filter((k) => k !== "package_title");
  const select = [...dbColumns, spec.selectExtra].filter(Boolean).join(",");

  const rows = [];
  for (let start = 0; start < MAX_ROWS; start += BATCH) {
    let query = session.supabase.from(spec.table).select(select);
    if (from) query = query.gte("created_at", istDayStart(from));
    if (to) query = query.lt("created_at", istNextDayStart(to));
    if (status) query = query.eq("status", status);
    if (service) query = query.contains("services", [service]);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(start, start + BATCH - 1);
    if (error) return new Response("Could not load data", { status: 500 });
    rows.push(...(data ?? []));
    if (!data || data.length < BATCH) break;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(spec.sheet);
  sheet.columns = columns.map((c) => ({
    header: c.label,
    key: c.key,
    width: Math.max(14, c.label.length + 4),
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const r of rows) {
    const flat = type === "bookings" ? { ...r, package_title: r.packages?.title ?? "" } : r;
    sheet.addRow(Object.fromEntries(columns.map((c) => [c.key, cell(c.key, flat[c.key])])));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const label = [from && `from-${from}`, to && `to-${to}`, status, service && service.replace(/\s+/g, "-")]
    .filter(Boolean)
    .join("_");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${spec.sheet.toLowerCase()}-${label || stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
