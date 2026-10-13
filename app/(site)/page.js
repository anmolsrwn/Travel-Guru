// Home page (design 3.8, 5.3). Server Component, ISR every 5 minutes and on
// revalidatePath("/") after admin edits (Req 40.1–40.3). Content comes from the
// published Supabase rows with a per-list static fallback (lib/server/content.js).
import { preload } from "react-dom";
import { BUSINESS, PACKAGES, DESTINATIONS } from "@/lib/data";
import { loadPublicContent } from "@/lib/server/content";
import { getPublicClient } from "@/lib/supabase/public";
import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import Services from "@/components/sections/Services";
import Collections from "@/components/sections/Collections";
import CategoryFilter from "@/components/client/CategoryFilter";
import Destinations from "@/components/sections/Destinations";
import DestinationTiles from "@/components/client/DestinationTiles";
import HowItWorks from "@/components/sections/HowItWorks";
import QuoteSection from "@/components/sections/QuoteSection";
import QuoteForm from "@/components/client/QuoteForm";
import Expert from "@/components/sections/Expert";
import Reviews from "@/components/sections/Reviews";
import Faq from "@/components/sections/Faq";
import FaqAccordion from "@/components/client/FaqAccordion";
import Terms from "@/components/sections/Terms";
import TermsTabs from "@/components/client/TermsTabs";
import FinalCta from "@/components/sections/FinalCta";

export const revalidate = 300;

// Logs carry only event names, collection names, error codes and record ids (no PII).
function logContent(event, meta) {
  console.warn(event, meta);
}

export default async function Home() {
  // LCP image (Req 5.9).
  preload(BUSINESS.heroImage, { as: "image", fetchPriority: "high" });

  const { packages, destinations } = await loadPublicContent({
    client: getPublicClient(), // null when env vars are missing → static catalogue
    fallback: { packages: PACKAGES, destinations: DESTINATIONS },
    log: logContent,
  });

  // Header, floating WhatsApp and mobile sticky bar are rendered by the layout.
  // Only plain serialisable data (arrays of plain objects) is passed as props.
  return (
    <main id="main">
      <Hero />
      <TrustStrip />
      <Services />
      <Collections packages={packages}>
        <CategoryFilter packages={packages} />
      </Collections>
      <Destinations destinations={destinations} packages={packages}>
        <DestinationTiles destinations={destinations} packages={packages} />
      </Destinations>
      <HowItWorks />
      <QuoteSection>
        <QuoteForm />
      </QuoteSection>
      <Expert />
      <Reviews />
      <Faq>
        <FaqAccordion />
      </Faq>
      <Terms>
        <TermsTabs />
      </Terms>
      <FinalCta />
    </main>
  );
}
