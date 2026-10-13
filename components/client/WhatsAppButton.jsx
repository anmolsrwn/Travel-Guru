"use client";

// WhatsApp CTA. Server HTML is a real wa.me link (works without JS, Req 26.1);
// with JS the click opens it via window.open(..., "noopener") and falls back to
// the current tab when the popup is blocked (Req 27.2, 5.10, 18.9).
import { BUSINESS } from "@/lib/data";
import { buildWhatsAppUrl } from "@/lib/logic";
import btn from "@/components/ui/Button.module.css";

/**
 * Opens a URL in a new tab with no opener reference, or in this tab if the popup
 * is blocked. window.open(url, "_blank", "noopener") always returns null per the
 * HTML spec, so a null check on it would also navigate this tab on success.
 * Instead: open a same-origin blank tab (null only when blocked), sever
 * `opener` before navigating, then load the URL. Same effect as noopener.
 * @param {string} url
 */
export function openWhatsApp(url) {
  const win = window.open("about:blank", "_blank");
  if (!win) {
    window.location.href = url;
    return;
  }
  win.opener = null;
  win.location.replace(url);
}

/**
 * @param {object} props
 * @param {string | (() => string)} props.message pre-filled text, or a function evaluated at click time
 * @param {import("react").ReactNode} props.children button label
 * @param {string} [props.number=BUSINESS.whatsapp] digits-only WhatsApp number
 * @param {string} [props.className] replaces the default `btn whatsapp` classes
 * @param {boolean} [props.icon=true] show the WhatsApp glyph before the label
 * @param {string} [props.ariaLabel] accessible name when the label is not descriptive
 */
export function WhatsAppButton({
  message,
  children,
  number = BUSINESS.whatsapp,
  className,
  icon = true,
  ariaLabel,
}) {
  const resolve = () => buildWhatsAppUrl(number, typeof message === "function" ? message() : message ?? "");
  const href = typeof message === "function" ? buildWhatsAppUrl(number, "") : resolve();

  function handleClick(event) {
    // Let modified clicks (new tab/window) behave as normal links.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    openWhatsApp(resolve());
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? `${btn.btn} ${btn.whatsapp}`}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {icon && <WhatsAppIcon className={btn.icon} />}
      {children}
    </a>
  );
}

/** WhatsApp glyph, decorative. */
export function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.31l-.35-.2-3.57.93.95-3.48-.22-.36a9.42 9.42 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.46-9.44 2.53 0 4.9.99 6.69 2.78a9.38 9.38 0 0 1 2.77 6.68c0 5.21-4.24 9.44-9.47 9.44m8.05-17.5A11.32 11.32 0 0 0 12.05.67C5.78.67.67 5.77.67 12.04c0 2 .52 3.96 1.52 5.69L.57 23.67l6.08-1.6a11.36 11.36 0 0 0 5.4 1.38h.01c6.27 0 11.38-5.1 11.38-11.37 0-3.04-1.18-5.9-3.34-8.05" />
    </svg>
  );
}

export default WhatsAppButton;
