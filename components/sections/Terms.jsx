// Terms & Policies section shell (Server Component; design section 12, Req 31, 24.7, 27.1).
// The TermsTabs client component mounts as `children` (app/(site)/page.js: <Terms><TermsTabs /></Terms>);
// without children all seven panels render statically, each with its deep-link id
// (#terms-inclusions … #terms-disclaimer). TermsTabs reuses TERMS_PANELS and TermsPanelBody.
import { BUSINESS, POLICIES } from "@/lib/data";
import { formatPrice } from "@/lib/logic";
import table from "@/components/ui/DataTable.module.css";
import s from "./Terms.module.css";

/** Panel ids (deep-link targets) and labels, in the order of Req 31.1. */
export const TERMS_PANELS = [
  { id: "terms-inclusions", label: "Inclusions", title: "Package Inclusions" },
  { id: "terms-exclusions", label: "Exclusions", title: "Package Exclusions" },
  { id: "terms-conditions", label: "Important Terms", title: "Important Terms & Conditions" },
  { id: "terms-payment", label: "Payment", title: "Payment Policy" },
  { id: "terms-cancellation", label: "Cancellation", title: "Cancellation Policy" },
  { id: "terms-remarks", label: "General Remarks", title: "General Remarks" },
  { id: "terms-disclaimer", label: "Disclaimer & Safety", title: "Disclaimer & Safety" },
];

/** The three Payment_Policy rules (Req 31.4), generated from BUSINESS.paymentPolicy. */
export function paymentPolicyRules(policy = BUSINESS.paymentPolicy) {
  const threshold = formatPrice(policy.thresholdPerPersonINR, "INR");
  const pct = Math.round(policy.advanceRate * 100);
  return [
    `Packages below ${threshold} per person: full payment at booking.`,
    `Packages of ${threshold} per person or more: ${pct}% advance at booking, balance ${policy.balanceDueDaysBefore} days prior to departure.`,
    `Bookings made within ${policy.fullPaymentWithinDays} days of departure: full payment at booking.`,
  ];
}

function List({ items }) {
  return (
    <ul className={s.list}>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function CancellationTable({ bands }) {
  return (
    <div className={table.wrap}>
      <table className={table.table}>
        <caption className={table.caption}>Cancellation charges (per person, on total package cost)</caption>
        <thead>
          <tr>
            <th scope="col">Days before departure</th>
            <th scope="col" className={table.num}>
              Charge
            </th>
          </tr>
        </thead>
        <tbody>
          {bands.map((b) => (
            <tr key={b.label}>
              <td data-label="Days before departure">{b.label}</td>
              <td data-label="Charge" className={table.num}>{`${Math.round(b.rate * 100)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Body of one Terms panel (no heading). Server-safe (no hooks, no browser APIs), so it is
 * shared by the static fallback below and the TermsTabs client component.
 * @param {{ id: string, policies?: object, paymentPolicy?: object }} props
 */
export function TermsPanelBody({ id, policies = POLICIES, paymentPolicy = BUSINESS.paymentPolicy }) {
  switch (id) {
    case "terms-inclusions":
      return (
        <div className={s.columns}>
          <div>
            <h4 className={s.subTitle}>International tours</h4>
            <List items={policies.inclusions} />
          </div>
          <div>
            <h4 className={s.subTitle}>Domestic tours</h4>
            <List items={policies.inclusionsDomestic} />
          </div>
        </div>
      );
    case "terms-exclusions":
      return <List items={policies.exclusions} />;
    case "terms-conditions":
      return <List items={policies.importantTerms} />;
    case "terms-payment":
      return <List items={paymentPolicyRules(paymentPolicy)} />;
    case "terms-cancellation":
      return (
        <>
          <CancellationTable bands={policies.cancellation.table} />
          <List items={policies.cancellation.rules} />
        </>
      );
    case "terms-remarks":
      return <List items={policies.generalRemarks} />;
    case "terms-disclaimer":
      return <List items={policies.disclaimer} />;
    default:
      return null;
  }
}

/**
 * @param {{ policies?: object, paymentPolicy?: object, children?: React.ReactNode }} props
 */
export default function Terms({ policies = POLICIES, paymentPolicy = BUSINESS.paymentPolicy, children }) {
  const hasChildren = children != null && children !== false;
  return (
    <section id="terms" className="section" aria-labelledby="terms-title">
      <div className={`container ${s.narrow}`}>
        <header className="section-head">
          <p className="eyebrow">Terms &amp; Policies</p>
          <h2 id="terms-title">Clear terms, before you book</h2>
        </header>

        {hasChildren ? (
          children
        ) : (
          <>
            <nav aria-label="Terms sections" className={s.toc}>
              <ul>
                {TERMS_PANELS.map((p) => (
                  <li key={p.id}>
                    <a href={`#${p.id}`}>{p.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
            {TERMS_PANELS.map((p) => (
              <section key={p.id} id={p.id} className={s.panel} aria-labelledby={`${p.id}-title`}>
                <h3 id={`${p.id}-title`} className={s.panelTitle}>
                  {p.title}
                </h3>
                <TermsPanelBody id={p.id} policies={policies} paymentPolicy={paymentPolicy} />
              </section>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
