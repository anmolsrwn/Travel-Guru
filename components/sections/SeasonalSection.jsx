import Reveal from '@/components/client/Reveal';
import s from './SeasonalSection.module.css';

/**
 * "Best Time to Travel" section shell (Server Component).
 * children = <SeasonFilter /> client component mounted from app/page.js.
 * Falls back to a static package list when no children (no-JS fallback).
 */
export default function SeasonalSection({ packages = [], children }) {
  const hasChildren = children != null && children !== false;
  return (
    <section id="best-time" className={`section section--alt ${s.section}`} aria-labelledby="best-time-title">
      <Reveal>
        <div className="container">
          <header className="section-head">
            <p className="eyebrow">Best Time to Travel</p>
            <h2 id="best-time-title">
              Top picks for your{' '}
              <em><span className="gradient-text">next getaway</span></em>
            </h2>
            <p className={`lead ${s.lead}`}>
              Handpicked packages ideal for this time of year, departing from Raipur.
            </p>
          </header>

          {hasChildren ? (
            children
          ) : packages.length > 0 ? (
            <ul className={s.fallbackList}>
              {packages.map((pkg) => (
                <li key={pkg.id} className={s.fallbackItem}>
                  <span className={s.fallbackTitle}>{pkg.title}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
