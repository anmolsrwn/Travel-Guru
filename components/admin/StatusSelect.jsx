"use client";
// Generic status select + Save control (Requirement 43.2, 43.4), shared by the
// leads and bookings tables.
//
// Props:
//   action  — Server Action `(id, status) => Promise<{ ok: true, status } | { ok: false, error }>`
//   formAction — alternative: Server Action `(prev, formData) => Promise<same result>`
//             reading the hidden `id` and the `status` select from the form (use one of the two)
//   id      — row id passed to `action`
//   value   — current saved status
//   options — allowed statuses (e.g. LEAD_STATUSES / BOOKING_STATUSES)
//   label   — accessible label for the select (visually hidden), e.g. "Status for QT-2025-0001"
//
// On success the saved status becomes the new value; on failure an error is
// announced and the select is reset to the previous saved status.
import { useActionState, useId } from "react";
import f from "@/components/ui/Field.module.css";
import btn from "@/components/ui/Button.module.css";
import s from "./StatusSelect.module.css";

const FAILURE = "Could not update the status. Try again.";

export default function StatusSelect({ action, formAction: serverFormAction, id, value, options, label = "Status" }) {
  const uid = useId();
  const selectId = `${uid}-status`;
  const statusId = `${uid}-msg`;

  const [state, formAction, pending] = useActionState(
    async (prev, formData) => {
      const next = formData.get("status");
      let result;
      try {
        // `formAction` style: `(prev, formData) => result` reading `id` + `status` from the form.
        // `action` style: `(id, status) => result`.
        result = serverFormAction
          ? await serverFormAction(prev, formData)
          : await action(id, typeof next === "string" ? next : "");
      } catch {
        result = null;
      }
      if (result && result.ok === true) {
        return { saved: result.status ?? next, message: `Saved: ${result.status ?? next}`, error: false, version: prev.version + 1 };
      }
      return {
        saved: prev.saved,
        message: (result && typeof result.error === "string" && result.error) || FAILURE,
        error: true,
        // Bumping the version re-mounts the select so it shows the previous saved status.
        version: prev.version + 1,
      };
    },
    { saved: value, message: "", error: false, version: 0 }
  );

  return (
    <form action={formAction} className={s.form}>
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>
      <input type="hidden" name="id" value={id} />
      <select
        key={state.version}
        id={selectId}
        name="status"
        defaultValue={state.saved}
        className={`${f.select} ${s.select}`}
        aria-describedby={statusId}
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
      <p id={statusId} role="status" aria-live="polite" className={state.error ? f.error : f.hint}>
        {state.message}
      </p>
    </form>
  );
}
