"use client";
// Destination editor (Requirement 44.8, 44.9). The same readDestinationForm()
// the server uses runs before sending: validateDestination errors are listed by
// field and nothing is sent. saveDestination re-validates anyway.
import { startTransition, useActionState, useRef, useState, useTransition } from "react";
import { saveDestination, deleteDestination } from "@/app/admin/(protected)/destinations/actions";
import { destinationFieldsFromFormData, readDestinationForm } from "@/lib/destination-form";
import f from "@/components/ui/Field.module.css";
import btn from "@/components/ui/Button.module.css";
import s from "./PackageForm.module.css";

const FIX_MESSAGE = "Fix the errors below.";

/**
 * @param {{
 *   isCreate: boolean,
 *   initial: { id: string, name: string, tagline: string, region: string, image: string,
 *              packageId: string, sortOrder: number, isPublished: boolean },
 *   packages: { id: string, title: string }[],
 *   initialMessage?: string,
 * }} props
 */
export default function DestinationForm({ isCreate, initial, packages, initialMessage = "" }) {
  const [state, dispatch, saving] = useActionState(saveDestination, {
    ok: initialMessage !== "",
    message: initialMessage,
    errors: {},
  });
  const [local, setLocal] = useState(null); // client-side check result; null once sent
  const [deleting, startDelete] = useTransition();
  const [deleteMessage, setDeleteMessage] = useState("");
  const statusRef = useRef(null);

  const shown = local ?? state;
  const errors = shown?.errors ?? {};
  const errorEntries = Object.entries(errors);
  const busy = saving || deleting;
  const packageIds = packages.map((p) => p.id);
  // Keep a linked id selectable even if that package no longer exists, so the error is visible.
  const orphan = initial.packageId !== "" && !packageIds.includes(initial.packageId);

  const invalid = (name) => (Object.hasOwn(errors, name) ? "true" : undefined);
  const describedBy = (name) => (Object.hasOwn(errors, name) ? "dest-status" : undefined);

  function onSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = readDestinationForm(destinationFieldsFromFormData(formData), packageIds);
    setDeleteMessage("");
    if (!result.valid) {
      setLocal({ ok: false, message: FIX_MESSAGE, errors: result.errors });
      statusRef.current?.focus();
      return;
    }
    setLocal(null);
    // Dispatched manually (not via the form action prop) so React does not reset the fields.
    startTransition(() => dispatch(formData));
  }

  function onDelete() {
    if (!window.confirm(`Delete destination "${initial.id}"? This cannot be undone.`)) return;
    setDeleteMessage("");
    startDelete(async () => {
      // Redirects to the list on success; otherwise returns a message.
      const result = await deleteDestination(initial.id);
      if (result && !result.ok) setDeleteMessage(result.message);
    });
  }

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate>
      {!isCreate && <input type="hidden" name="originalId" value={initial.id} />}

      <div className={s.grid}>
        <div className={f.field}>
          <label className={f.label} htmlFor="dest-id">
            Id (slug)
          </label>
          <input
            id="dest-id"
            name="id"
            className={f.input}
            defaultValue={initial.id}
            readOnly={!isCreate}
            maxLength={64}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid("id")}
            aria-describedby={isCreate ? `dest-id-hint ${describedBy("id") ?? ""}`.trim() : describedBy("id")}
          />
          {isCreate ? (
            <p id="dest-id-hint" className={f.hint}>
              Lowercase letters, digits and hyphens. Cannot be changed later.
            </p>
          ) : null}
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="dest-name">
            Name
          </label>
          <input
            id="dest-name"
            name="name"
            className={f.input}
            defaultValue={initial.name}
            maxLength={80}
            aria-invalid={invalid("name")}
            aria-describedby={describedBy("name")}
          />
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="dest-region">
            Region
          </label>
          <select
            id="dest-region"
            name="region"
            className={f.select}
            defaultValue={initial.region}
            aria-invalid={invalid("region")}
            aria-describedby={describedBy("region")}
          >
            <option value="international">International</option>
            <option value="domestic">Domestic</option>
          </select>
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="dest-package">
            Linked package
          </label>
          <select
            id="dest-package"
            name="packageId"
            className={f.select}
            defaultValue={initial.packageId}
            aria-invalid={invalid("packageId")}
            aria-describedby={describedBy("packageId")}
          >
            <option value="">None</option>
            {orphan ? <option value={initial.packageId}>{initial.packageId} (missing)</option> : null}
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title ? `${p.title} (${p.id})` : p.id}
              </option>
            ))}
          </select>
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="dest-sort">
            Sort order
          </label>
          <input
            id="dest-sort"
            name="sortOrder"
            type="number"
            inputMode="numeric"
            step={1}
            className={f.input}
            defaultValue={initial.sortOrder}
            aria-invalid={invalid("sortOrder")}
            aria-describedby={describedBy("sortOrder")}
          />
        </div>
      </div>

      <div className={f.field}>
        <label className={f.label} htmlFor="dest-tagline">
          Tagline
        </label>
        <input
          id="dest-tagline"
          name="tagline"
          className={f.input}
          defaultValue={initial.tagline}
          maxLength={120}
          aria-invalid={invalid("tagline")}
          aria-describedby={describedBy("tagline")}
        />
      </div>

      <div className={f.field}>
        <label className={f.label} htmlFor="dest-image">
          Image (/assets/… or https URL)
        </label>
        <input
          id="dest-image"
          name="image"
          className={f.input}
          defaultValue={initial.image}
          maxLength={500}
          spellCheck={false}
          aria-invalid={invalid("image")}
          aria-describedby={describedBy("image")}
        />
      </div>

      <label className={s.check}>
        <input type="checkbox" name="isPublished" defaultChecked={initial.isPublished} />
        Published (shown on the public site)
      </label>

      <div id="dest-status" ref={statusRef} tabIndex={-1}>
        <p className={shown?.ok ? s.success : s.error} role="status" aria-live="polite">
          {shown?.message ?? ""}
        </p>
        {errorEntries.length > 0 ? (
          <ul className={s.errors}>
            {errorEntries.map(([path, message]) => (
              <li key={path}>
                <code>{path}</code>: {message}
              </li>
            ))}
          </ul>
        ) : null}
        {deleteMessage ? (
          <p className={s.error} role="alert">
            {deleteMessage}
          </p>
        ) : null}
      </div>

      <div className={s.actions}>
        <button
          type="submit"
          className={`${btn.btn} ${btn.primary}`}
          disabled={busy}
          aria-disabled={busy ? "true" : undefined}
        >
          {saving ? "Saving…" : isCreate ? "Create destination" : "Save"}
        </button>
        {!isCreate ? (
          <button
            type="button"
            className={`${btn.btn} ${btn.secondary} ${s.danger}`}
            onClick={onDelete}
            disabled={busy}
            aria-disabled={busy ? "true" : undefined}
          >
            {deleting ? "Deleting…" : "Delete destination"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
