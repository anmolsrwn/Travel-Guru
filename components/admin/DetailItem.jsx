// One label / value pair in an expanded admin row (server-safe, no hooks).
import s from "./LeadsTable.module.css";

export default function DetailItem({ label, wide, children }) {
  return (
    <div className={wide ? `${s.detailItem} ${s.detailWide}` : s.detailItem}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}