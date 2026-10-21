import { BUSINESS } from "@/lib/data";

// Public pages only (the admin area is excluded in robots.js).
export default function sitemap() {
  const base = BUSINESS.website.replace(/\/$/, "");
  const paths = [
    { path: "", priority: 1 },
    { path: "/trips", priority: 0.8 },
    { path: "/forex", priority: 0.7 },
    { path: "/quote", priority: 0.7 },
  ];
  return paths.map(({ path, priority }) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
}