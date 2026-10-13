"use client";
// Package editor (Requirement 44.2, 44.5, 44.6, 44.8). Columns as fields, the
// `data` part as a JSON textarea. The same readPackageForm() the server uses
// runs before sending: a JSON syntax error or validatePackage errors are listed
// by path and nothing is sent. savePackage re-parses and re-validates anyway.
import { startTransition, useActionState, useRef, useState, useTransition } from "react";
import { savePackage, deletePackage } from "@/app/admin/(protected)/packages/actions";
import { fieldsFromFormData, readPackageForm } from "@/lib/package-form";
import { CATEGORIES } from "@/lib/data";
import f from "@/components/ui/Field.module.css";
import btn from "@/components/ui/Button.module.css";
import s from "./PackageForm.module.css";

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c.id !== "all");
const FIX_MESSAGE = "Fix the errors below.";
// Error paths that belong to a form field; every other path is inside the JSON.
const COLUMN_FIELDS = new Set(["id", "title", "region", "categories", "nights", "days", "image", "sortOrder"]);

/**
 * @param {{
 *   isCreate: boolean,
 *   initial: { id: string, title: string, region: string, categories: string[], nights: number,
 *              days: number, image: string, sortOrder: number, isPublished: boolean, data: string },
 *   initialMessage?: string,
 * }} props
 */
export default function PackageForm({ isCreate, initial, example = null, initialMessage = "" }) {
  const formRef = useRef(null);
  const [state, dispatch, saving] = useActionState(savePackage, {
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

  const invalid = (name) => (Object.hasOwn(errors, name) ? "true" : undefined);
  const describedBy = (name) => (Object.hasOwn(errors, name) ? "pkg-status" : undefined);

  function onSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = readPackageForm(fieldsFromFormData(formData));
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

  // Prefills the uncontrolled fields from the example (create only; the id stays as typed).
  function onLoadExample() {
    const form = formRef.current;
    if (!form || !example) return;
    const el = form.elements;
    el.namedItem("title").value = example.title;
    el.namedItem("region").value = example.region;
    el.namedItem("nights").value = String(example.nights);
    el.namedItem("days").value = String(example.days);
    el.namedItem("image").value = example.image;
    el.namedItem("data").value = example.data;
    for (const box of form.querySelectorAll('input[name="categories"]')) {
      box.checked = example.categories.includes(box.value);
    }
    setLocal(null);
  }

  function onDelete() {
    if (!window.confirm(`Delete package "${initial.id}"? This cannot be undone.`)) return;
    setDeleteMessage("");
    startDelete(async () => {
      // Redirects to the list on success; otherwise returns a message.
      const result = await deletePackage(initial.id);
      if (result && !result.ok) setDeleteMessage(result.message);
    });
  }

  return (
    <form ref={formRef} className={s.form} onSubmit={onSubmit} noValidate>
      {!isCreate && <input type="hidden" name="originalId" value={initial.id} />}

      <div className={s.grid}>
        <div className={f.field}>
          <label className={f.label} htmlFor="pkg-id">
            Id (slug)
          </label>
          <input
            id="pkg-id"
            name="id"
            className={f.input}
            defaultValue={initial.id}
            readOnly={!isCreate}
            maxLength={64}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid("id")}
            aria-describedby={isCreate ? `pkg-id-hint ${describedBy("id") ?? ""}`.trim() : describedBy("id")}
          />
          {isCreate ? (
            <p id="pkg-id-hint" className={f.hint}>
              Lowercase letters, digits and hyphens. Cannot be changed later.
            </p>
          ) : null}
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="pkg-title">
            Title
          </label>
          <input
            id="pkg-title"
            name="title"
            className={f.input}
            defaultValue={initial.title}
            maxLength={120}
            aria-invalid={invalid("title")}
            aria-describedby={describedBy("title")}
          />
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="pkg-region">
            Region
          </label>
          <select
            id="pkg-region"
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
          <label className={f.label} htmlFor="pkg-nights">
            Nights
          </label>
          <input
            id="pkg-nights"
            name="nights"
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            step={1}
            className={f.input}
            defaultValue={initial.nights}
            aria-invalid={invalid("nights")}
            aria-describedby={describedBy("nights")}
          />
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="pkg-days">
            Days (nights + 1)
          </label>
          <input
            id="pkg-days"
            name="days"
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            step={1}
            className={f.input}
            defaultValue={initial.days}
            aria-invalid={invalid("days")}
            aria-describedby={describedBy("days")}
          />
        </div>

        <div className={f.field}>
          <label className={f.label} htmlFor="pkg-sort">
            Sort order
          </label>
          <input
            id="pkg-sort"
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
        <label className={f.label} htmlFor="pkg-image">
          Image (/assets/… or https URL)
        </label>
        <input
          id="pkg-image"
          name="image"
          className={f.input}
          defaultValue={initial.image}
          maxLength={500}
          spellCheck={false}
          aria-invalid={invalid("image")}
          aria-describedby={describedBy("image")}
        />
      </div>

      <fieldset className={s.fieldset} aria-describedby={describedBy("categories")}>
        <legend className={f.label}>Categories (must include the region)</legend>
        <div className={s.checks}>
          {CATEGORY_OPTIONS.map((c) => (
            <label key={c.id} className={s.check}>
              <input
                type="checkbox"
                name="categories"
                value={c.id}
                defaultChecked={initial.categories.includes(c.id)}
                aria-invalid={invalid("categories")}
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className={s.check}>
        <input type="checkbox" name="isPublished" defaultChecked={initial.isPublished} />
        Published (shown on the public site)
      </label>

      <div className={f.field}>
        <label className={f.label} htmlFor="pkg-data">
          Data (JSON)
        </label>
        <p id="pkg-data-hint" className={f.hint}>
          destination, highlights, hotelStarRating, mealPlan, transferBasis, tiers, extras, inclusions, itinerary,
          isSample, notes
        </p>
        <textarea
          id="pkg-data"
          name="data"
          className={`${f.textarea} ${s.json}`}
          defaultValue={initial.data}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={errorEntries.some(([p]) => !COLUMN_FIELDS.has(p)) ? "true" : undefined}
          aria-describedby="pkg-data-hint pkg-status"
        />
      </div>

      <div id="pkg-status" ref={statusRef} tabIndex={-1}>
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
          {saving ? "Saving…" : isCreate ? "Create package" : "Save"}
        </button>
        {isCreate && example ? (
          <button type="button" className={`${btn.btn} ${btn.secondary}`} onClick={onLoadExample} disabled={busy}>
            Load example
          </button>
        ) : null}
        {!isCreate ? (
          <button
            type="button"
            className={`${btn.btn} ${btn.secondary} ${s.danger}`}
            onClick={onDelete}
            disabled={busy}
            aria-disabled={busy ? "true" : undefined}
          >
            {deleting ? "Deleting…" : "Delete package"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
