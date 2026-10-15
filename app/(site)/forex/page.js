// /forex: the Forex Counter calculator (moved off the home page to keep it short).
import ForexSection from "@/components/sections/ForexSection";

export const metadata = {
  title: "Forex Counter",
  description: "Check indicative foreign exchange rates and request a formal forex quote within 24 hours.",
};

export default function ForexPage() {
  return (
    <main id="main" className="page-top">
      <ForexSection />
    </main>
  );
}
