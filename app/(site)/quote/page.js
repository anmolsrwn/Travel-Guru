// /quote: the 24h trip quotation form (moved off the home page to keep it short).
import QuoteSection from "@/components/sections/QuoteSection";
import QuoteForm from "@/components/client/QuoteForm";

export const metadata = {
  title: "Get a Free Trip Quotation",
  description: "Tell us your dream trip and get a custom quotation and call back within 24 hours.",
};

export default function QuotePage() {
  return (
    <main id="main" className="page-top">
      <QuoteSection>
        <QuoteForm />
      </QuoteSection>
    </main>
  );
}
