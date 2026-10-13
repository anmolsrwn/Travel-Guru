"use client";

// "Enquire" link on a Services card (Req 7.3, 7.5). A real `<a href="#quote">` so it
// works without JavaScript; with JS a plain click scrolls to the quote form and
// publishes a "service" intent that the QuoteForm applies.
import { QUOTE_SECTION_ID, useQuoteIntent } from "./QuoteIntentProvider";

/**
 * @param {object} props
 * @param {string} props.quoteOption member of QUOTE_SERVICE_OPTIONS
 * @param {string} props.label accessible name, e.g. "Enquire about Flights"
 * @param {string} [props.className]
 * @param {import("react").ReactNode} [props.children] visible content (default "Enquire")
 */
export function EnquireButton({ quoteOption, label, className, children = "Enquire" }) {
  const { enquireService } = useQuoteIntent();

  function handleClick(event) {
    // Modified / non-primary clicks keep normal link behaviour (new tab etc.).
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    enquireService(quoteOption);
  }

  return (
    <a
      href={`#${QUOTE_SECTION_ID}`}
      className={className}
      aria-label={label}
      data-quote-option={quoteOption}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

export default EnquireButton;
