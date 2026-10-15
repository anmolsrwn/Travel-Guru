// Home page (design 3.8, 5.3). Server Component, ISR every 5 minutes and on
// revalidatePath("/") after admin edits (Req 40.1–40.3). Content comes from the
// published Supabase rows with a per-list static fallback (lib/server/content.js).
import { preload } from "react-dom";
import { BUSINESS, REVIEWS } from "@/lib/data";
import { loadSiteContent } from "@/lib/server/siteContent";
import { fetchGoogleReviews } from "@/lib/server/googleReviews";
import Hero from "@/components/sections/Hero";
import SeasonalSection from "@/components/sections/SeasonalSection";
import SeasonFilter from "@/components/client/SeasonFilter";
import ExploreLinks from "@/components/sections/ExploreLinks";
import TrustStrip from "@/components/sections/TrustStrip";
import Services from "@/components/sections/Services";
import Destinations from "@/components/sections/Destinations";
import DestinationTiles from "@/components/client/DestinationTiles";
import HowItWorks from "@/components/sections/HowItWorks";
import Expert from "@/components/sections/Expert";
import Reviews from "@/components/sections/Reviews";
import Faq from "@/components/sections/Faq";
import FaqAccordion from "@/components/client/FaqAccordion";
import Terms from "@/components/sections/Terms";
import TermsTabs from "@/components/client/TermsTabs";
import FinalCta from "@/components/sections/FinalCta";

export const revalidate = 300;

export default async function Home() {
  // LCP image (Req 5.9).
  preload(BUSINESS.heroImage, { as: "image", fetchPriority: "high" });

  // Handcrafted trips, forex and the quote form live on /trips, /forex and /quote.
  const { packages, destinations } = await loadSiteContent();
  // Fetch live Google reviews; fall back to static placeholders if unavailable.
  const googleData = await fetchGoogleReviews();
  const reviews = googleData?.reviews?.length ? googleData.reviews : REVIEWS;
  const liveRating = googleData?.rating ?? null;
  const liveReviewCount = googleData?.userRatingCount ?? null;

  // Header, floating WhatsApp and mobile sticky bar are rendered by the layout.
  // Only plain serialisable data (arrays of plain objects) is passed as props.
  return (
    <main id="main">
      {/* Story order: hook → proof → gateway → what we do → where → when → how → who →
          reviews → answers → policies → act. Section backgrounds alternate plain / alt
          (--bg-1) so each block reads as its own band. */}
      <Hero />
      <SeasonalSection packages={packages}>
        <SeasonFilter packages={packages} />
      </SeasonalSection>
      <TrustStrip />
      <ExploreLinks />
      <Services />
      <Destinations destinations={destinations} packages={packages}>
        <DestinationTiles destinations={destinations} packages={packages} />
      </Destinations>
      <HowItWorks />
      <Expert />
      <Reviews reviews={reviews} liveRating={liveRating} liveReviewCount={liveReviewCount} />
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
