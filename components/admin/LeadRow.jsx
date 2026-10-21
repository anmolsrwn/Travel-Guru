"use client";
// One quotation as an inbox row. The summary row shows tick box, name, date and service (the
// date and service cells are passed in as children). Clicking the row opens a details row
// underneath (the server-rendered `detail` node).
//   - new (unread) rows are bold; opening the row makes it normal weight.
//   - the tick box starts empty; the admin ticks it once the query is solved (unticking undoes it).
import { useId, useState, useTransition } from "react";
import { useBulk } from "./BulkSelect";
import s from "./LeadsTable.module.css";

const COLUMNS = 7;

// `onRead(id, bool)` and `onDone(id, bool)` are Server Actions returning { ok, error? }.
// `onDelete(id)` is a Server Action that permanently removes the row.
export default function LeadRow({ id, name, initialRead, initialDone, label, detail, onRead, onDone, onDelete, children }) {
  const detailId = useId();
  const [read, setRead] = useState(initialRead);
  const [done, setDone] = useState(initialDone);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const bulk = useBulk();
  const deleted = bulk.deleted.has(id);
  const [, startTransition] = useTransition();

  // Optimistic update; reverts and shows an error if the server refuses.
  function save(action, setter, previous, next) {
    setter(next);
    setError("");
    startTransition(async () => {
      let result;
      try {
        result = await action(id, next);
      } catch {
        result = null;
      }
      if (!result || result.ok !== true) {
        setter(previous);
        setError((result && result.error) || "Could not update. Try again.");
      }
    });
  }

  function markRead() {
    if (!read) save(onRead, setRead, false, true);
  }

  function toggle() {
    setOpen((value) => !value);
    markRead();
  }

  function onTick(next) {
    markRead(); // solving a query implies it was opened
    save(onDone, setDone, done, next);
  }

  function remove() {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    setError("");
    startTransition(async () => {
      let result;
      try {
        result = await onDelete(id);
      } catch {
        result = null;
      }
      if (result && result.ok === true) {
        bulk.markDeleted([id]);
      } else {
        setError((result && result.error) || "Could not delete. Try again.");
      }
    });
  }

  if (deleted) return null;

  const className = [s.summary, read ? "" : s.unread, done ? s.done : ""].filter(Boolean).join(" ");

  return (
    <>
      <tr className={className} onClick={toggle}>
        <td data-label="Solved" className={s.check}>
          <input
            type="checkbox"
            checked={done}
            onChange={(event) => onTick(event.target.checked)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`${done ? "Mark as not solved" : "Mark as solved"}: ${label}`}
            title={done ? "Solved. Untick to reopen" : "Tick when this query is solved"}
          />
          {error ? (
            <span role="alert" className={s.rowError}>
              {error}
            </span>
          ) : null}
        </td>
        <td data-label="Name">
          <button
            type="button"
            className={s.nameButton}
            aria-expanded={open}
            aria-controls={open ? detailId : undefined}
          >
            {name}
          </button>
        </td>
        {children}
        <td data-label="Details" className={s.chevron} aria-hidden="true">
          {open ? "▾" : "▸"}
        </td>
        <td data-label="Delete" className={s.remove}>
          <button
            type="button"
            className={s.deleteButton}
            onClick={(event) => {
              event.stopPropagation();
              remove();
            }}
            aria-label={`Delete ${label}`}
            title="Delete permanently"
          >
            Delete
          </button>
        </td>
        <td data-label="Select" className={s.selectCell}>
          <input
            type="checkbox"
            className={s.selectBox}
            checked={bulk.selected.has(id)}
            onChange={(event) => bulk.toggle(id, event.target.checked)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Select ${label}`}
          />
        </td>
      </tr>
      {open ? (
        <tr className={s.detailRow}>
          <td colSpan={COLUMNS} id={detailId} className={s.detailCell}>
            {detail}
          </td>
        </tr>
      ) : null}
    </>
  );
}