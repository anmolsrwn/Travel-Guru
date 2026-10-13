"use client";
// Per-row booking status select + Save (Requirement 43.4, 43.6).
// Submits { id, status } to the updateBookingStatus Server Action via
// useActionState; the result is announced in an aria-live region. On failure the
// select is re-mounted so it shows the last saved status again.
import { useActionState, useId } from "react";
import { updateBookingStatus } from "@/app/admin/(protected)/bookings/actions";
import f from "@/components/ui/Field.module.css";
import btn from "@/components/ui/Button.module.css";
import s from "./StatusSelect.module.css";

/**
 * @param {{ id: string, value: string, options: readonly string[], label?: string }} props
 */
export default function BookingStatusSelect({ id, value, options, label = "Status" }) {
  const uid = useId();
  const selectId = `${uid}-status`;
  const messageId = `${uid}-msg`;

  const [state, formAction, pending] = useActionState(
    async (prev, formData) => {
      let result;
      try {
        result = await updateBookingStatus(prev, formData);
      } catch {
        result = null;
      }
      const version = prev.version + 1;
      if (result && result.ok === true) {
        return { saved: result.status, message: result.message, error: false, version };
      }
      return {
        saved: prev.saved,
        message: (result && result.message) || "Could not update the status. Try again.",
        error: true,
        version,
      };
    },
    { saved: value, message: "", error: false, version: 0 }
  );

  return (
    <form action={formAction} className={s.form}>
      <input type="hidden" name="id" value={id} />
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>
      <select
        key={state.version}
        id={selectId}
        name="status"
        defaultValue={state.saved}
        className={`${f.select} ${s.select}`}
        aria-describedby={messageId}
        aria-invalid={state.error ? "true" : undefined}
        disabled={pending}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className={`${btn.btn} ${btn.secondary} ${btn.sm}`}
        disabled={pending}
        aria-disabled={pending ? "true" : undefined}
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <p id={messageId} role="status" aria-live="polite" className={state.error ? f.error : f.hint}>
        {state.message}
      </p>
    </form>
  );
}
