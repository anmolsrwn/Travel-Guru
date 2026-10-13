"use client";

// Operations FAQ accordion (Req 21.1–21.3, 21.6; design 3.5 Accordion).
// Every item starts collapsed; each question is a <button> with aria-expanded and
// aria-controls pointing at its answer region. Collapsed panels are `inert` so
// keyboard and screen-reader users skip the hidden answers. The "+" icon rotates
// to "×" via Accordion.module.css when the item is open.
import { useId, useState } from "react";
import { FAQ } from "@/lib/data";
import acc from "@/components/ui/Accordion.module.css";

/**
 * @param {{ items?: {q: string, a: string, link?: {href: string, label: string}}[] }} props
 */
export function FaqAccordion({ items = FAQ }) {
  const baseId = useId();
  // Set of open item indexes; empty on load so every item is collapsed (Req 21.6).
  const [openItems, setOpenItems] = useState(() => new Set());

  function toggle(index) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className={acc.list}>
      {items.map((item, index) => {
        const open = openItems.has(index);
        const triggerId = `${baseId}-faq-t${index}`;
        const panelId = `${baseId}-faq-p${index}`;
        return (
          <div key={item.q} className={`${acc.item} ${open ? acc.open : ""}`}>
            <h3 className={acc.heading}>
              <button
                type="button"
                id={triggerId}
                className={acc.trigger}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span>{item.q}</span>
                <span className={acc.icon} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={panelId}
              className={acc.panel}
              role="region"
              aria-labelledby={triggerId}
              inert={!open}
            >
              <div className={acc.panelInner}>
                <div className={acc.content}>
                  <p>{item.a}</p>
                  {item.link ? (
                    <p>
                      <a href={item.link.href}>{item.link.label}</a>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FaqAccordion;
