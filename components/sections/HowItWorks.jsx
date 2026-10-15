// How It Works: header only (the step list was removed on request). Server Component.
import { Reveal } from "@/components/client/Reveal";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section" aria-labelledby="how-it-works-title">
      <Reveal className="container">
        <div className="section-head">
          <p className="eyebrow">How It Works</p>
          <h2 id="how-it-works-title">
            Your journey begins with a <span className="gradient-text">hello</span>
          </h2>
        </div>
      </Reveal>
    </section>
  );
}

export default HowItWorks;
