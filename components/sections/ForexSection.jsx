// Forex Counter section (forex-counter Req 4, 10.6). Server Component.
// Renders directly after Services (plain background), so it takes the alternate background.
import { FOREX_CURRENCIES, CURRENCIES } from "@/lib/data";
import { Reveal } from "@/components/client/Reveal";
import { ForexCalculator } from "@/components/client/ForexCalculator";
import s from "./ForexSection.module.css";

export function ForexSection() {
  return (
    <section id="forex-counter" className="section section--alt" aria-labelledby="forex-title">
      <Reveal>
        <div className="container">
          <header className="section-head">
            <p className="eyebrow">Forex Counter</p>
            <h2 id="forex-title">
              Exchange Foreign Currency with{" "}
              <em><span className="gradient-text">Confidence</span></em>
            </h2>
            <p className={`lead ${s.lead}`}>
              Travel Guru Raipur offers competitive foreign exchange rates for major currencies.
              Calculate rates instantly and get a formal quote within 24 hours.
            </p>
          </header>

          <ForexCalculator />

          <div className={s.currencies}>
            <h3 className={s.currenciesTitle} id="forex-currencies-title">Supported currencies</h3>
            <ul className={s.currencyList} aria-labelledby="forex-currencies-title">
              {FOREX_CURRENCIES.map((code) => (
                <li key={code} className={s.currency}>
                  <span className={s.code}>{code}</span>
                  <span className={s.symbol}>{CURRENCIES[code]?.symbol}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default ForexSection;
