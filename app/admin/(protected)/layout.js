// Auth gate for every signed-in admin page (Requirement 42.3, 42.5, 44.10).
// /admin/login sits outside this route group, so it is never gated (no redirect loop).
//
//   env vars missing   → "Database not configured"
//   no signed-in user  → redirect to /admin/login (proxy.js normally does this first)
//   signed in, not in admins → "Not authorised" + Sign out, children never rendered
//   admin              → admin nav + Sign out + <main id="main">{children}</main>
//
// Pages under this group render their content without their own <main> and MUST
// call getAdminSession() again before reading data (it is cached per request).
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/server/admin-session";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";
import s from "@/components/admin/AdminShell.module.css";

export const dynamic = "force-dynamic";

function Notice({ title, children }) {
  return (
    <main id="main" className={s.main}>
      <div className={s.notice} role="alert">
        <h1 className={s.noticeTitle}>{title}</h1>
        {children}
      </div>
    </main>
  );
}

export default async function ProtectedAdminLayout({ children }) {
  const session = await getAdminSession();

  if (session.status === "not-configured") {
    return (
      <Notice title="Database not configured">
        <p className={s.noticeText}>
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use the admin area.
        </p>
      </Notice>
    );
  }

  // redirect() throws; nothing below runs for signed-out visitors.
  if (session.status === "unauthenticated") redirect("/admin/login");

  if (session.status !== "ok") {
    return (
      <Notice title="Not authorised">
        <p className={s.noticeText}>This account does not have access to the admin area.</p>
        <SignOutButton />
      </Notice>
    );
  }

  return (
    <>
      <header className={s.bar}>
        <p className={s.brand}>Admin</p>
        <AdminNav />
        <SignOutButton />
      </header>
      <main id="main" className={s.main}>
        {children}
      </main>
    </>
  );
}
