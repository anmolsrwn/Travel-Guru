'use client';

// Seasonal carousel — center card fully visible, side cards blurred/dimmed.
// Auto-advances every 4s. Auto-detects current month.
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { filterPackagesBySeason, fromPriceINR } from '@/lib/logic';
import { MONTH_NAMES } from '@/lib/data';
import { useLocalTodayISO } from '@/components/client/localToday';
import { SafeImage } from '@/components/client/SafeImage';
import s from './SeasonFilter.module.css';

const AUTO_INTERVAL = 4000;
const MAX_CARDS = 3;

export function SeasonFilter({ packages = [] }) {
  const isoDate = useLocalTodayISO();
  const currentMonth = isoDate ? parseInt(isoDate.slice(5, 7), 10) : null;
  const monthName = currentMonth ? MONTH_NAMES[currentMonth - 1] : null;

  const picks = currentMonth
    ? filterPackagesBySeason(packages, currentMonth).slice(0, MAX_CARDS)
    : [];

  const [active, setActive] = useState(0);
  const count = picks.length;

  function prev() { setActive(i => ((i - 1) + count) % count); }
  function next() { setActive(i => (i + 1) % count); }

  // Auto-advance
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(t);
  }, [active, count]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setActive(0); }, [currentMonth]);

  if (!currentMonth) {
    return <p className={s.loading}>Finding the best trips for this season…</p>;
  }

  if (count === 0) {
    return (
      <p className={s.empty}>
        No packages for {monthName} yet.{' '}
        <Link href="/trips">Browse all →</Link>
      </p>
    );
  }

  // Build ordered list: prev, active, next (wrapping) with position labels
  // For N cards we show all, each getting a position relative to active
  function getPos(i) {
    let diff = i - active;
    // Wrap to [-floor(count/2), +floor(count/2)]
    while (diff > count / 2) diff -= count;
    while (diff < -count / 2) diff += count;
    return diff; // -2, -1, 0, +1, +2 …
  }

  return (
    <div className={s.root} aria-label={`Best packages for ${monthName}`}>
      {/* Season label */}
      <p className={s.label}>
        <span className={s.dot} aria-hidden="true" />
        Best picks for <strong>{monthName}</strong>
      </p>

      {/* Carousel */}
      <div className={s.stage}>
        {count > 1 && (
          <button type="button" className={`${s.arrow} ${s.arrowLeft}`} onClick={prev} aria-label="Previous package">
            &#8249;
          </button>
        )}

        <div className={s.track}>
          {picks.map((pkg, i) => {
            const pos = getPos(i);
            const isCenter = pos === 0;
            const isAdjacent = Math.abs(pos) === 1;
            const isHidden = Math.abs(pos) > 1;

            return (
              <div
                key={pkg.id}
                className={s.cardWrap}
                data-pos={pos}
                style={{
                  '--pos': pos,
                }}
                aria-hidden={!isCenter ? 'true' : undefined}
              >
                <article
                  className={[
                    s.card,
                    isCenter ? s.cardCenter : '',
                    isAdjacent ? s.cardSide : '',
                    isHidden ? s.cardHidden : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !isCenter && setActive(i)}
                >
                  <div className={s.cardImg}>
                    <SafeImage
                      src={pkg.image}
                      alt={pkg.title}
                      width={560}
                      height={360}
                    />
                  </div>
                  <div className={s.cardBody}>
                    <p className={s.cardMeta}>
                      {pkg.region === 'domestic' ? 'Domestic' : 'International'}&nbsp;&middot;&nbsp;{pkg.nights}N/{pkg.days}D
                    </p>
                    <h3 className={s.cardTitle}>{pkg.title}</h3>
                    {Array.isArray(pkg.highlights) && pkg.highlights.length > 0 && (
                      <ul className={s.highlights}>
                        {pkg.highlights.slice(0, 2).map(h => <li key={h}>{h}</li>)}
                      </ul>
                    )}
                    <p className={s.price}>
                      from&nbsp;<span>&#8377;{fromPriceINR(pkg).toLocaleString('en-IN')}</span>
                      <span className={s.pp}>&nbsp;/pp</span>
                    </p>
                    {isCenter && (
                      <Link href="/trips" className={s.cta}>View Package &#8594;</Link>
                    )}
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <button type="button" className={`${s.arrow} ${s.arrowRight}`} onClick={next} aria-label="Next package">
            &#8250;
          </button>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className={s.dots}>
          {picks.map((pkg, i) => (
            <button
              key={pkg.id}
              type="button"
              aria-label={`Go to ${pkg.title}`}
              aria-current={i === active ? 'true' : undefined}
              className={`${s.dotBtn} ${i === active ? s.dotActive : ''}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}

      <Link href="/trips" className={s.hint}>See all packages &#8594;</Link>
    </div>
  );
}

export default SeasonFilter;
