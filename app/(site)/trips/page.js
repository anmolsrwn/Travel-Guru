// /trips: the curated, handcrafted journeys (moved off the home page to keep it short).
import Collections from "@/components/sections/Collections";
import CategoryFilter from "@/components/client/CategoryFilter";
import { loadSiteContent } from "@/lib/server/siteContent";

export const revalidate = 300;

export const metadata = {
  title: "Handcrafted Trips",
  description: "Curated land packages from Raipur, priced transparently. Flights are quoted separately at live fares.",
};

export default async function TripsPage() {
  const { packages } = await loadSiteContent();
  return (
    <main id="main" className="page-top">
      <Collections packages={packages}>
        <CategoryFilter packages={packages} />
      </Collections>
    </main>
  );
}
