"use client";

// Modal_Manager (Req 25.1–25.5, 24.1, 3.10, 3.12). Holds at most one open modal.
//
//   const modal = useModal();
//   modal.open(content, props?, triggerEl?)  open (or swap, if one is already open)
//   modal.replace(content, props?)           swap the open modal's content; keeps the
//                                            original trigger for focus return
//   modal.close()                            animate out (350ms, 0 under reduced
//                                            motion), unmount, restore scroll + focus
//   modal.isOpen / modal.current             current state (current = id or component)
//
// `content` is either a string id registered with registerModal(id, Component) or a
// component / render function `(props) => <ItineraryModal … />`. It is rendered as
// <Content {...props} /> and is expected to render <Modal titleId=… > itself.
//
// The provider owns the page-level side effects for the whole open session (they
// persist across replace()): body.no-scroll lock with the prior scroll offset
// restored on close, `inert` on every sibling of #modal-root, and focus return to
// the trigger (defaults to document.activeElement at open time).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const MODAL_ROOT_ID = "modal-root";
const CLOSE_MS = 350; // --dur-modal

/** @type {Map<string, import("react").ComponentType<any>>} */
const registry = new Map();

/**
 * Register a modal component under a string id so it can be opened with open("id").
 * Call at module scope of the modal's own file.
 * @param {string} id
 * @param {import("react").ComponentType<any>} Component
 */
export function registerModal(id, Component) {
  registry.set(id, Component);
}

const ModalContext = createContext(null);
/** Internal: lets <Modal> know whether it is closing / should skip its enter animation. */
export const ModalStateContext = createContext({ closing: false, animateIn: true, close: () => {} });

function resolveContent(content) {
  if (typeof content === "string") {
    const Component = registry.get(content);
    if (!Component) throw new Error(`useModal: no modal registered with id "${content}"`);
    return Component;
  }
  if (typeof content === "function") return content;
  throw new TypeError("useModal: content must be a registered id or a component");
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Lock page scroll, keeping the current offset (works on iOS Safari too). */
function lockScroll() {
  const { body, documentElement } = document;
  const scrollY = window.scrollY;
  const scrollbar = window.innerWidth - documentElement.clientWidth;
  const prev = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
  };
  body.classList.add("no-scroll");
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

  return function unlockScroll() {
    body.classList.remove("no-scroll");
    Object.assign(body.style, prev);
    // Jump back without the smooth scroll-behavior set on <html>.
    const html = documentElement.style.scrollBehavior;
    documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, scrollY);
    documentElement.style.scrollBehavior = html;
  };
}

/** Mark every sibling of #modal-root inert; returns the undo function. */
function inertPage() {
  const root = document.getElementById(MODAL_ROOT_ID);
  const parent = root?.parentElement ?? document.body;
  const marked = [];
  for (const el of parent.children) {
    if (el === root || el.tagName === "SCRIPT" || el.hasAttribute("inert")) continue;
    el.setAttribute("inert", "");
    marked.push(el);
  }
  return () => marked.forEach((el) => el.removeAttribute("inert"));
}

/**
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 */
export function ModalProvider({ children }) {
  // entry: { key, content, Content, props, closing, animateIn } | null
  const [entry, setEntry] = useState(null);
  const triggerRef = useRef(null);
  const keyRef = useRef(0);
  const isOpen = entry !== null;

  const replace = useCallback((content, props = {}) => {
    const Content = resolveContent(content);
    keyRef.current += 1;
    const key = keyRef.current;
    setEntry((prev) => ({ key, content, Content, props, closing: false, animateIn: prev === null }));
  }, []);

  const open = useCallback(
    (content, props = {}, triggerEl) => {
      resolveContent(content); // throw before touching triggerRef if the id is unregistered
      // Keep the first trigger if a modal is already open (single-modal session).
      if (!triggerRef.current) {
        const active = typeof document !== "undefined" ? document.activeElement : null;
        triggerRef.current = triggerEl ?? (active && active !== document.body ? active : null);
      }
      replace(content, props);
    },
    [replace],
  );

  const close = useCallback(() => {
    setEntry((prev) => (prev && !prev.closing ? { ...prev, closing: true } : prev));
  }, []);

  // Unmount after the exit animation. A new open()/replace() during the exit
  // produces a non-closing entry, which cancels this timer via the cleanup.
  const closing = entry?.closing ?? false;
  useEffect(() => {
    if (!closing) return undefined;
    const timer = setTimeout(() => setEntry(null), prefersReducedMotion() ? 0 : CLOSE_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  // Page-level side effects for one open session (survive replace()).
  useEffect(() => {
    if (!isOpen) return undefined;
    const unlockScroll = lockScroll();
    const unInert = inertPage();
    return () => {
      unInert();
      unlockScroll();
      const trigger = triggerRef.current;
      triggerRef.current = null;
      if (trigger && trigger.isConnected && typeof trigger.focus === "function") {
        trigger.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  const value = useMemo(
    () => ({ open, replace, close, isOpen, current: entry?.content ?? null }),
    [open, replace, close, isOpen, entry?.content],
  );

  const state = useMemo(
    () => ({ closing, animateIn: entry?.animateIn ?? true, close }),
    [closing, entry?.animateIn, close],
  );

  const Content = entry?.Content;

  return (
    <ModalContext.Provider value={value}>
      {children}
      {Content && (
        <ModalStateContext.Provider value={state}>
          <Content key={entry.key} {...entry.props} />
        </ModalStateContext.Provider>
      )}
    </ModalContext.Provider>
  );
}

/** @returns {{ open: Function, replace: Function, close: Function, isOpen: boolean, current: any }} */
export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}

export default ModalProvider;
