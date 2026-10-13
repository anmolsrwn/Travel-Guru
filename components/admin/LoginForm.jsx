"use client";
// Admin sign-in form (Requirement 42.1, 42.6). Email + password only; no sign-up link.
import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import f from "@/components/ui/Field.module.css";
import btn from "@/components/ui/Button.module.css";
import s from "./LoginForm.module.css";

const initialState = { error: "" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const error = state?.error || "";

  return (
    <form action={formAction} className={s.form} aria-describedby="login-status">
      <div className={f.field}>
        <label className={f.label} htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          className={f.input}
          autoComplete="username"
          maxLength={254}
          required
          aria-invalid={error ? "true" : undefined}
        />
      </div>

      <div className={f.field}>
        <label className={f.label} htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          className={f.input}
          autoComplete="current-password"
          required
          aria-invalid={error ? "true" : undefined}
        />
      </div>

      <p id="login-status" className={f.error} role="status" aria-live="polite">
        {error}
      </p>

      <button
        type="submit"
        className={`${btn.btn} ${btn.primary} ${btn.block}`}
        disabled={pending}
        aria-disabled={pending ? "true" : undefined}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
