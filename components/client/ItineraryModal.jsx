"use client";

// Itinerary modal (design 5 "Itinerary modal" wireframe, Req 11.1–11.9, 11.12–11.14, 9.7, 8.14).
// Registered as "itinerary": `modal.open("itinerary", { pkg, tierId? }, triggerEl)`.
// Renders the shared <Modal size="lg"> shell (920px; full-screen sheet on mobile).
//
// "Confirm via WhatsApp" opens WhatsApp directly with the booking message for the
// active tier (2 adults, land total, policy line). "Book This Package" hands off to
// the Checkout_Modal (Req 11.10) with `modal.replace("checkout", { pkg, tierId })`, so
// exactly one modal stays open and focus still returns to the original trigger. The
// "checkout" id is registered by CheckoutModal (task 13.7); until then the click is a no-op.
import { useId, useState } from "react";
import { BUSINESS, POLICIES } from "@/lib/data";
import { composeBookingWhatsAppMessage, computeLandTotal, getTier, packageInclusions } from "@/lib/logic";
import "@/components/client/CheckoutModal"; // side effect: registerModal("checkout", …) for the Book hand-off
import { Modal } from "@/components/client/Modal";
import { registerModal, useModal } from "@/components/client/ModalProvider";
import { SafeImage } from "@/components/client/SafeImage";
import { Price, useCurrency } from "@/components/client/CurrencyProvider";
import { WhatsAppButton } from "@/components/client/WhatsAppButton";
import btn from "@/components/ui/Button.module.css";
import badge from "@/components/ui/Badge.module.css";
import seg from "@/components/ui/Segmented.module.css";
import table from "@/components/ui/DataTable.module.css";
import s from "./ItineraryModal.module.css";

const REGION_LABEL = { international: "International", domestic: "Domestic" };
export const TRANSFER_LABEL = { private: "Private", sharing: "Sharing", mixed: "Private + Sharing" };
const TERMS_EXCLUSIONS_ID = "terms-exclusions";

/** "A / B or similar" when several alternatives are listed, else the single name. */
export function hotelNames(names) {
  const list = Array.isArray(names) ? names.filter(Boolean) : [];
  if (list.length <= 1) return list[0] ?? "";
  return `${list.join(" / ")} or similar`;
}

/**
 * Wait until the modal session has ended (scroll lock released), then go to the
 * Terms exclusions panel. Navigating while body is position:fixed would be undone
 * when ModalProvider restores the prior scroll offset.
 */
function goToExclusionsAfterClose() {
  const started = Date.now();
  function step() {
    const locked = document.body.classList.contains("no-scroll");
    if (locked && Date.now() - started < 2000) {
      requestAnimationFrame(step);
      return;
    }
    const hash = `#${TERMS_EXCLUSIONS_ID}`;
    if (window.location.hash !== hash) {
      // TermsTabs listens to hashchange: opens the panel and scrolls to it.
      window.location.hash = TERMS_EXCLUSIONS_ID;
    } else {
      const target =
        document.getElementById(`${TERMS_EXCLUSIONS_ID}-acc`)?.getClientRects().length > 0
          ? document.getElementById(`${TERMS_EXCLUSIONS_ID}-acc`)
          : document.getElementById("terms-tabs") ?? document.getElementById(TERMS_EXCLUSIONS_ID);
      target?.scrollIntoView({ block: "start" });
    }
  }
  requestAnimationFrame(step);
}

/**
 * @param {object} props
 * @param {object} props.pkg Package (plain object)
 * @param {string | null} [props.tierId] initially active tier; defaults to the cheapest tier
 */
export function ItineraryModal({ pkg, tierId: initialTierId = null }) {
  const titleId = useId();
  const tierGroup = useId();
  const modal = useModal();
  const { currency } = useCurrency();
  const [tierId, setTierId] = useState(() => getTier(pkg, initialTierId).id);
  const tier = getTier(pkg, tierId);

  const facts = [
    REGION_LABEL[pkg.region] ?? pkg.region,
    `${pkg.nights}N/${pkg.days}D`,
    pkg.hotelStarRating != null ? `${pkg.hotelStarRating}★` : null,
    pkg.mealPlan || null,
  ].filter(Boolean);

  const inclusions = packageInclusions(pkg, POLICIES);
  const extras = pkg.extras ?? {};
  const onArrival = Array.isArray(extras.onArrivalCharges) ? extras.onArrivalCharges : [];
  const days = Array.isArray(pkg.itinerary) ? [...pkg.itinerary].sort((a, b) => a.day - b.day) : [];
  const notes = Array.isArray(pkg.notes) ? pkg.notes : [];
  const exclusions = POLICIES.exclusions.slice(0, POLICIES.exclusionsSummaryCount);

  const whatsappMessage = () =>
    composeBookingWhatsAppMessage(
      pkg,
      { tierId: tier.id, currency },
      computeLandTotal({ tier, adults: 2, children: 0 }),
      BUSINESS,
    );

  function onBook() {
    try {
      modal.replace("checkout", { pkg, tierId: tier.id });
    } catch {
      // "checkout" not registered yet (task 13.7): keep the itinerary open.
    }
  }

  function onSeeAllTerms(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    modal.close();
    goToExclusionsAfterClose();
  }

  return (
    <Modal titleId={titleId} size="lg" closeLabel="Close itinerary">
      <div className={s.strip}>
        <SafeImage src={pkg.image} alt={pkg.title} width={1200} height={400} className={s.stripImage} />
      </div>

      <header className={s.head}>
        <p className={s.meta}>
          {facts.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </p>
        <h2 id={titleId} className={s.title}>
          {pkg.title}
        </h2>
        {pkg.transferBasis ? <p className={s.transferBasis}>{pkg.transferBasis}</p> : null}
        {pkg.isSample ? <span className={`${badge.badge} ${badge.neutral}`}>Sample itinerary</span> : null}
      </header>

      <section className={s.block} aria-labelledby={`${titleId}-tiers`}>
        <h3 id={`${titleId}-tiers`} className={s.blockTitle}>
          Compare hotel tiers
        </h3>
        <div className={table.wrap}>
          <table className={table.table}>
            <caption className="sr-only">Price per person by hotel tier (land package)</caption>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col" className={table.num}>
                  Adult /pp
                </th>
                <th scope="col" className={table.num}>
                  Child /pp
                </th>
              </tr>
            </thead>
            <tbody>
              {pkg.tiers.map((t) => (
                <tr key={t.id} className={t.id === tier.id ? s.activeRow : undefined}>
                  <td data-label="Tier">
                    {t.label}
                    {t.hotelLabel ? <span className={s.hotelLabel}> ({t.hotelLabel} hotels)</span> : null}
                  </td>
                  <td data-label="Adult /pp" className={table.num}>
                    <Price amountINR={t.adultPriceINR} />
                  </td>
                  <td data-label="Child /pp" className={table.num}>
                    {t.childPriceINR != null ? <Price amountINR={t.childPriceINR} /> : "On request"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.block} aria-labelledby={`${titleId}-stay`}>
        <div className={s.tierRow}>
          <span id={`${tierGroup}-label`} className={s.tierLabel}>
            Hotels:
          </span>
          <div role="radiogroup" aria-labelledby={`${tierGroup}-label`} className={seg.group}>
            {pkg.tiers.map((t) => (
              <label key={t.id} className={seg.option}>
                <input
                  type="radio"
                  name={tierGroup}
                  value={t.id}
                  className={seg.input}
                  checked={t.id === tier.id}
                  onChange={() => setTierId(t.id)}
                />
                <span className={seg.segment}>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div key={tier.id} className={s.tierBody} data-tier-id={tier.id}>
          <p className={s.priceLine}>
            <span>
              Adult <Price amountINR={tier.adultPriceINR} className="price" /> /pp
            </span>
            <span aria-hidden="true"> · </span>
            <span>
              {tier.childPriceINR != null ? (
                <>
                  Child <Price amountINR={tier.childPriceINR} /> /pp
                </>
              ) : (
                "Child price on request"
              )}
            </span>
            <span className={s.land}> (land package)</span>
          </p>
          {tier.priceNote ? <p className={s.priceNote}>{tier.priceNote}</p> : null}

          <h3 id={`${titleId}-stay`} className={s.blockTitle}>
            {`Where you'll stay (${tier.label} tier${tier.hotelLabel ? `, ${tier.hotelLabel} hotels` : ""})`}
          </h3>
          <ul className={s.hotels}>
            {tier.hotels.map((h, i) => (
              <li key={`${h.location}-${i}`} className={s.hotel}>
                <span className={s.hotelWhere}>{`${h.location} · ${h.nights}N`}</span>
                <span className={s.hotelName}>
                  {hotelNames(h.names)}
                  {h.roomType ? <span className={s.roomType}>{` · ${h.roomType}`}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.block} aria-labelledby={`${titleId}-inc`}>
        <h3 id={`${titleId}-inc`} className={s.blockTitle}>
          Inclusions
        </h3>
        <ul className={s.chips}>
          {inclusions.map((item) => (
            <li key={item} className={`${badge.badge} ${badge.emerald} ${s.chip}`}>
              <span aria-hidden="true">✓</span> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className={`${s.block} ${s.extras}`} aria-labelledby={`${titleId}-extras`}>
        <h3 id={`${titleId}-extras`} className={s.blockTitle}>
          Priced separately (not included)
        </h3>
        <ul className={s.extrasList}>
          <li>
            <span aria-hidden="true">✈ </span>
            {extras.flightFareINR != null ? (
              <>
                Flights ≈ <Price amountINR={extras.flightFareINR} /> per person
                {extras.flightNote ? `. ${extras.flightNote}` : ""}
              </>
            ) : (
              "Flights quoted on request"
            )}
          </li>
          {extras.visa ? (
            <li>
              {`Visa (${extras.visa.type}): `}
              <Price amountINR={extras.visa.feeINR} /> per person
            </li>
          ) : null}
          {onArrival.length > 0 ? (
            <li>
              On arrival, paid by you:
              <ul className={s.subList}>
                {onArrival.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </li>
          ) : null}
        </ul>
      </section>

      <section className={s.block} aria-labelledby={`${titleId}-days`}>
        <h3 id={`${titleId}-days`} className={s.blockTitle}>
          Day by day
        </h3>
        <ol className={s.timeline}>
          {days.map((d) => (
            <li key={d.day} className={s.day}>
              <div className={s.dayHead}>
                <span className={s.dayNum}>{`Day ${d.day}`}</span>
                <span className={s.dayTitle}>{d.title}</span>
                {d.transferType && TRANSFER_LABEL[d.transferType] ? (
                  <span className={`${badge.badge} ${badge.neutral} ${s.transfer}`}>
                    {TRANSFER_LABEL[d.transferType]}
                  </span>
                ) : null}
              </div>
              <p className={s.dayText}>{d.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {notes.length > 0 ? (
        <section className={s.block} aria-labelledby={`${titleId}-notes`}>
          <h3 id={`${titleId}-notes`} className={s.blockTitle}>
            Good to know
          </h3>
          <ul className={s.notes}>
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={`${s.block} ${s.exclusions}`} aria-label="Not included">
        <p>
          <strong>Not included:</strong> {exclusions.join("; ")}…{" "}
          <a href={`#${TERMS_EXCLUSIONS_ID}`} className={s.termsLink} onClick={onSeeAllTerms}>
            See all Terms <span aria-hidden="true">→</span>
          </a>
        </p>
      </section>

      <footer className={s.actions}>
        <WhatsAppButton message={whatsappMessage}>Confirm via WhatsApp</WhatsAppButton>
        <button type="button" className={`${btn.btn} ${btn.primary}`} data-action="itinerary-book" onClick={onBook}>
          Book This Package
        </button>
      </footer>
    </Modal>
  );
}

registerModal("itinerary", ItineraryModal);

export default ItineraryModal;
