// /admin/login: public sign-in page for staff (Requirement 42.1, 42.8).
// Sign-in only; there is no sign-up page, route, action or link.
import LoginForm from "@/components/admin/LoginForm";
import s from "@/components/admin/LoginForm.module.css";

export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

// Never statically generated or cached by ISR.
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <main id="main" className={s.page}>
      <div className={s.card}>
        <h1 className={s.title}>Admin sign in</h1>
        {configured ? (
          <LoginForm />
        ) : (
          <p className={s.notice} role="alert">
            Database not configured
          </p>
        )}
      </div>
    </main>
  );
}
