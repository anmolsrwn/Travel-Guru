// How It Works (Req 6.3, 6.4, 6.5, 32.1). Server Component.
// Hours come from BUSINESS; the advance wording follows BUSINESS.paymentPolicy.
import { BUSINESS } from "@/lib/data";
import { Reveal } from "@/components/client/Reveal";
import styles from "./HowItWorks.module.css";

export function HowItWorks() {
  const { callbackHours, quoteValidityHours, paymentPolicy } = BUSINESS;
  const advancePct = Math.round(paymentPolicy.advanceRate * 100);

  const steps = [
    {
      title: "Share your wishlist",
      text: "Two minutes on our quote form or WhatsApp.",
    },
    {
      title: "We call you back",
      text: `A real consultant within ${callbackHours} hours.`,
    },
    {
      title: "Receive your quote",
      text: "Tailored itinerary at B2B net rates.",
    },
    {
      title: `Confirm with ${advancePct}%`,
      text: "Advance on booking, balance 21 days before departure.",
    },
  ];

  return (
    <section id="how-it-works" className="section" aria-labelledby="how-it-works-title">
      <Reveal className="container">
        <div className="section-head">
          <p className="eyebrow">How It Works</p>
          <h2 id="how-it-works-title">
            From wishlist to <span className="gradient-text">wanderlust</span>
          </h2>
        </div>

        <ol className={styles.steps} role="list">
          {steps.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.num} aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className={styles.title}>
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className={styles.text}>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}

export default HowItWorks;
