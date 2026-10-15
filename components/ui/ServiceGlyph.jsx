// Service icon glyphs and accent classes, shared by the Services cards (Server
// Component) and the QuoteForm service tiles (Client Component). No hooks, no
// directive: safe in both module graphs.
import svc from "./Service.module.css";

// accent token ("--svc-blue") → Service.module.css class ("svcBlue").
export const ACCENT_CLASS = {
  "--svc-blue": svc.svcBlue,
  "--svc-orange": svc.svcOrange,
  "--svc-purple": svc.svcPurple,
  "--svc-red": svc.svcRed,
  "--svc-green": svc.svcGreen,
  "--svc-teal": svc.svcTeal,
  "--svc-violet": svc.svcViolet,
  "--svc-pink": svc.svcPink,
};

// Simple 24×24 filled glyphs keyed by SERVICES[].icon.
const GLYPHS = {
  plane: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
  hotel: "M3 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4h4a2 2 0 0 1 2 2v10h-7v-4h-4v4H3zm3-14v2h2V7H6zm4 0v2h2V7h-2zm-4 4v2h2v-2H6zm4 0v2h2v-2h-2zm6 2v2h2v-2h-2z",
  passport: "M6 2h11a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm5.5 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 1.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM8 17v1.6h7V17H8z",
  visa: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm4.5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM4.5 16h6c0-1.7-1.3-2.5-3-2.5s-3 .8-3 2.5zM13 9v1.6h6V9h-6zm0 3v1.6h6V12h-6z",
  palm: "M12 3c3.5 0 6.5 2 7.5 5h-6.3l-.2 1.2c2.6.5 4.6 2.4 5 4.8h-5.3L13 21h-2.2l.6-7h-5.3c.4-2.4 2.4-4.3 5-4.8L11 8H4.5C5.5 5 8.5 3 12 3zM3 20h18v2H3v-2z",
  shield: "M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3zm-1.2 13.2l5.6-5.6-1.4-1.4-4.2 4.2-2.2-2.2-1.4 1.4 3.6 3.6z",
  train: "M12 2c4 0 8 .5 8 4v9.5A3.5 3.5 0 0 1 16.5 19l1.5 1.5v.5h-2.2l-2-2h-3.6l-2 2H6v-.5L7.5 19A3.5 3.5 0 0 1 4 15.5V6c0-3.5 4-4 8-4zM6 6v5h12V6H6zm1.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
  suitcase: "M9 2h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2zm0 2v2h6V4H9zM8 8v11h2V8H8zm6 0v11h2V8h-2z",
  currency: "M12 2a10 10 0 1 1 0 20 10 10 0 1 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 1 0 0-16zM8 7h8v1.6H8V7zm0 2.8h8v1.6H8V9.8zM9.2 11.4h1.9l3.9 5.9h-2l-3.8-5.9z",
};

/** Decorative service glyph (aria-hidden). Unknown names render nothing. */
export function ServiceGlyph({ name }) {
  const d = GLYPHS[name];
  if (!d) return null;
  return (
    <svg className={svc.glyph} viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default ServiceGlyph;
