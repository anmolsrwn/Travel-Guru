"use client";
// Multi-select + bulk delete for the quotations and bookings tables. The provider wraps the
// table; each LeadRow reads it for its select box and for hiding rows once deleted.
import { createContext, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import s from "./LeadsTable.module.css";

const BulkContext = createContext(null);

export function useBulk() {
  return useContext(BulkContext);
}

// `ids`: every row id in the table. `onDeleteMany(ids)`: Server Action returning
// { ok, deleted?: string[], error? }. `noun`: "quotation" | "booking" (for messages).
export function BulkProvider({ ids, onDeleteMany, noun, children }) {
  const [selected, setSelected] = useState(() => new Set());
  const [deleted, setDeleted] = useState(() => new Set());
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const visibleIds = useMemo(() => ids.filter((id) => !deleted.has(id)), [ids, deleted]);

  function markDeleted(removed) {
    setDeleted((prev) => new Set([...prev, ...removed]));
    setSelected((prev) => new Set([...prev].filter((id) => !removed.includes(id))));
  }

  function toggle(id, on) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(on) {
    setSelected(on ? new Set(visibleIds) : new Set());
  }

  function deleteSelected() {
    const picked = [...selected];
    if (!picked.length) return;
    const text = `Delete ${picked.length} ${noun}${picked.length === 1 ? "" : "s"}? This cannot be undone.`;
    if (!window.confirm(text)) return;
    setError("");
    startTransition(async () => {
      let result;
      try {
        result = await onDeleteMany(picked);
      } catch {
        result = null;
      }
      if (result && result.ok === true) {
        markDeleted(result.deleted ?? picked);
      } else {
        setError((result && result.error) || "Could not delete. Try again.");
      }
    });
  }

  const value = { selected, deleted, toggle, toggleAll, markDeleted, visibleIds };

  return (
    <BulkContext.Provider value={value}>
      {selected.size > 0 || error ? (
        <div className={s.bulkBar} role="region" aria-label="Bulk actions">
          <span aria-live="polite">{selected.size} selected</span>
          <button type="button" className={s.deleteButton} onClick={deleteSelected} disabled={pending}>
            {pending ? "Deleting…" : "Delete selected"}
          </button>
          <button type="button" className={s.clearButton} onClick={() => toggleAll(false)} disabled={pending}>
            Clear
          </button>
          {error ? (
            <span role="alert" className={s.rowError}>
              {error}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </BulkContext.Provider>
  );
}

/** Header checkbox: selects or clears every remaining row. */
export function SelectAll() {
  const bulk = useBulk();
  const ref = useRef(null);
  const total = bulk.visibleIds.length;
  const count = bulk.selected.size;
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = count > 0 && count < total;
  }, [count, total]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={total > 0 && count === total}
      onChange={(event) => bulk.toggleAll(event.target.checked)}
      aria-label="Select all"
      className={s.selectBox}
    />
  );
}
