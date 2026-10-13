// Operations FAQ section shell (Server Component; design section 11, Req 27.1).
// The FaqAccordion client component (task 13.x) mounts as `children`; without children every
// FAQ entry renders as a native <details> disclosure, which works without JavaScript.
import { FAQ } from "@/lib/data";
import s from "./Faq.module.css";

/**
 * @param {{ items?: {q: string, a: string, link?: {href: string, label: string}}[], children?: React.ReactNode }} props
 */
export default function Faq({ items = FAQ, children }) {
  const hasChildren = children != null && children !== false;
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className={`container ${s.narrow}`}>
        <header className="section-head">
          <p className="eyebrow">Good to know</p>
          <h2 id="faq-title">Frequently asked questions</h2>
        </header>

        {hasChildren ? (
          children
        ) : (
          <div className={s.list}>
            {items.map((item) => (
              <details key={item.q} className={s.item}>
                <summary className={s.summary}>{item.q}</summary>
                <div className={s.answer}>
                  <p>{item.a}</p>
                  {item.link ? (
                    <p>
                      <a href={item.link.href}>{item.link.label}</a>
                    </p>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
