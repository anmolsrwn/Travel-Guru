"use client";

// Accessible dialog shell rendered by modal content components (ItineraryModal,
// CheckoutModal, VoucherModal, TicketModal) opened through useModal().
// Req 25.1 role/aria + first-focus, 25.2 Tab wrap, 25.3 Escape, 25.5 backdrop,
// 24.1 mobile full-screen sheet, 3.10 350ms motion. Scroll lock, `inert` and focus
// return live in ModalProvider so they persist across replace().
import { useContext, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ModalStateContext } from "./ModalProvider";
import styles from "./Modal.module.css";

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "summary",
  "audio[controls]",
  "video[controls]",
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Visible, tabbable descendants in DOM order. */
function focusables(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && !el.closest("[inert]") && el.getClientRects().length > 0,
  );
}

/**
 * @param {object} props
 * @param {string} props.titleId id of the modal's heading (aria-labelledby)
 * @param {() => void} [props.onClose] defaults to the provider's close()
 * @param {"md" | "lg"} [props.size="md"] md 760px, lg 920px (itinerary)
 * @param {string} [props.closeLabel="Close"] accessible name of the × button
 * @param {string} [props.className] extra class on the dialog panel
 * @param {import("react").ReactNode} props.children
 */
export function Modal({ titleId, onClose, size = "md", closeLabel = "Close", className, children }) {
  const { closing, animateIn, close } = useContext(ModalStateContext);
  const dialogRef = useRef(null);
  const pressStartedOnBackdrop = useRef(false);
  const onCloseRef = useRef(onClose ?? close);

  useEffect(() => {
    onCloseRef.current = onClose ?? close;
  }, [onClose, close]);

  // First focus, focus trap, Escape.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const first = focusables(dialog)[0];
    (first ?? dialog).focus({ preventScroll: true });

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables(dialog);
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === firstEl || !dialog.contains(active) || active === dialog)) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && (active === lastEl || !dialog.contains(active))) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    // Safety net: pull focus back if it ever lands outside the dialog.
    function onFocusIn(event) {
      if (!dialog.contains(event.target)) {
        (focusables(dialog)[0] ?? dialog).focus({ preventScroll: true });
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  if (typeof document === "undefined") return null;
  const root = document.getElementById("modal-root") ?? document.body;

  // Close only when the press both starts and ends on the backdrop itself, so a
  // text selection dragged out of the panel does not dismiss the modal.
  function onBackdropPointerDown(event) {
    pressStartedOnBackdrop.current = event.target === event.currentTarget;
  }
  function onBackdropClick(event) {
    if (pressStartedOnBackdrop.current && event.target === event.currentTarget) {
      onCloseRef.current();
    }
    pressStartedOnBackdrop.current = false;
  }

  const state = closing ? "closing" : animateIn ? "opening" : "open";

  return createPortal(
    <div
      className={styles.backdrop}
      data-state={state}
      onPointerDown={onBackdropPointerDown}
      onClick={onBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={[styles.dialog, size === "lg" ? styles.lg : styles.md, className].filter(Boolean).join(" ")}
        data-state={state}
      >
        <button type="button" className={styles.close} aria-label={closeLabel} onClick={() => onCloseRef.current()}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    root,
  );
}

export default Modal;
