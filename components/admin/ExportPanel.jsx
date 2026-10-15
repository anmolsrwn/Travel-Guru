// Collapsible "Download Excel" filter panel for /admin and /admin/bookings.
// A plain GET form posting to /admin/export/[type], so it works without client JavaScript:
// the response is an attachment, so the browser downloads it and stays on the page.
// All values are re-validated against allow-lists in lib/admin-export.js on the server.
import { EXPORT_TYPES, LEAD_SERVICES } from "@/lib/admin-export";
import f from "@/components/ui/Field.module.css";
import btn from "@/components/ui/Button.module.css";
import s from "./ExportPanel.module.css";

/** @param {{ type: "leads" | "bookings" }} props */
export default function ExportPanel({ type }) {
  const spec = EXPORT_TYPES[type];
  const noun = type === "leads" ? "quotations" : "bookings";

  return (
    <details className={s.panel}>
      <summary className={s.summary}>
        <span className={s.summaryLabel}>Download Excel</span>
        <span className={s.summaryHint}>Choose dates, status and columns</span>
      </summary>

      <form method="get" action={`/admin/export/${type}`} className={s.form}>
        <div className={s.grid}>
          <div className={f.field}>
            <label className={f.label} htmlFor={`${type}-from`}>
              From date
            </label>
            <input id={`${type}-from`} name="from" type="date" className={f.input} />
          </div>

          <div className={f.field}>
            <label className={f.label} htmlFor={`${type}-to`}>
              To date
            </label>
            <input id={`${type}-to`} name="to" type="date" className={f.input} />
          </div>

          <div className={f.field}>
            <label className={f.label} htmlFor={`${type}-status`}>
              Status
            </label>
            <select id={`${type}-status`} name="status" className={f.select} defaultValue="">
              <option value="">All statuses</option>
              {spec.statuses.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {type === "leads" && (
            <div className={f.field}>
              <label className={f.label} htmlFor="leads-service">
                Service
              </label>
              <select id="leads-service" name="service" className={f.select} defaultValue="">
                <option value="">All services</option>
                {LEAD_SERVICES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <fieldset className={s.columns}>
          <legend className={s.legend}>Columns to include</legend>
          <div className={s.checks}>
            {spec.columns.map((c) => (
              <label key={c.key} className={s.check}>
                <input type="checkbox" name="col" value={c.key} defaultChecked />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={s.footer}>
          <p className={f.hint}>
            Dates use the date each {type === "leads" ? "quotation" : "booking"} was created, in IST. Leave a field empty to
            skip that filter. All {noun} match if nothing is set.
          </p>
          <button type="submit" className={`${btn.btn} ${btn.primary} ${btn.sm}`}>
            Download .xlsx
          </button>
        </div>
      </form>
    </details>
  );
}
