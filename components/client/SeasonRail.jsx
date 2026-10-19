'use client';

// Compact "Best for {Month}" rail of up to 3 in-season packages.
// Static: no timers, arrows, or dots.
import Link from 'next/link';
import { selectRailPackages, fromPriceINR } from '@/lib/logic';
import { MONTH_NAMES } from '@/lib/data';
import { useLocalTodayISO } from '@/components/client/localToday';
import { SafeImage } from '@/components/client/SafeImage';
import s from './SeasonRail.module.css';

export function SeasonRail({ packages = [] }) {
  const isoDate = useLocalTodayISO();
  const currentMonth = isoDate ? parseInt(isoDate.slice(5, 7), 10) : null;

  // Month unresolved (pre-hydration): reserve space to avoid layout shift.
  if (!currentMonth) {
    return <div id="best-time" className={`${s.rail} ${s.placeholder}`} aria-hidden="true" />;
  }

  const monthName = MONTH_NAMES[currentMonth - 1];
  const picks = selectRailPackages(packages, currentMonth);

  if (picks.length === 0) return null;

  return (
    <div id="best-time" className={s.rail} aria-label={`Best packages for ${monthName}`}>
      <div className={s.head}>
        <p className={s.label}>
          <span className={s.dot} aria-hidden="true" />
          Best for <strong>{monthName}</strong>
        </p>
        <Link href="/trips" className={s.all}>See all packages &#8594;</Link>
      </div>

      <ul className={s.grid}>
        {picks.map((pkg) => (
          <li key={pkg.id} className={s.card}>
            <div className={s.img}>
              <SafeImage src={pkg.image} alt={pkg.title} width={560} height={360} />
            </div>
            <div className={s.body}>
              <p className={s.meta}>
                {pkg.region === 'domestic' ? 'Domestic' : 'International'}&nbsp;&middot;&nbsp;{pkg.nights}N/{pkg.days}D
              </p>
              <h3 className={s.title}>{pkg.title}</h3>
              <p className={s.price}>
                from&nbsp;<span>&#8377;{fromPriceINR(pkg).toLocaleString('en-IN')}</span>
                <span className={s.pp}>&nbsp;/pp</span>
              </p>
              <Link href="/trips" className={s.cta}>View Package &#8594;</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SeasonRail;
