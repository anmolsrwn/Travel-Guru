// Shared heading block for admin pages: eyebrow, title, optional subtitle and actions.
import s from "./AdminPage.module.css";

/** @param {{ title: string, subtitle?: React.ReactNode, eyebrow?: string, children?: React.ReactNode }} props */
export default function PageHeader({ title, subtitle, eyebrow, children }) {
  return (
    <div className={s.head}>
      <div className={s.headText}>
        {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {children && <div className={s.actions}>{children}</div>}
    </div>
  );
}
