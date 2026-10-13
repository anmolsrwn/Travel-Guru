"use client";

// One-shot scroll reveal (Req 3.11, 3.14). Server markup is fully visible; on the
// client, when IntersectionObserver exists and motion is allowed, the wrapper gets
// .is-pending and swaps to .is-revealed the first time it intersects. Classes live
// in app/globals.css (.reveal / .is-pending / .is-revealed).
import { useEffect, useRef } from "react";

/**
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @param {keyof JSX.IntrinsicElements} [props.as="div"] wrapper element
 * @param {string} [props.className] extra classes for the wrapper
 */
export function Reveal({ children, as: Tag = "div", className }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof window.IntersectionObserver !== "function") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    node.classList.add("is-pending");
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        node.classList.remove("is-pending");
        node.classList.add("is-revealed");
        observer.disconnect(); // never replay
      }
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
      // Leave content visible if unmounted/re-run before it was revealed.
      node.classList.remove("is-pending");
    };
  }, []);

  return (
    <Tag ref={ref} className={className ? `reveal ${className}` : "reveal"}>
      {children}
    </Tag>
  );
}

export default Reveal;
