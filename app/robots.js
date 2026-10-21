import { BUSINESS } from "@/lib/data";

// Lets search engines crawl the public site and keeps them out of the admin and API routes.
export default function robots() {
  const base = BUSINESS.website.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}