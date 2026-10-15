// lib/server/googleReviews.js
// Fetches the top Google reviews for the business via the Places API (New).
// Called only on the server — never imported by client components.
//
// Caching strategy:
//   - Next.js fetch() cache: 6-hour revalidation (ISR-friendly).
//   - Falls back to REVIEWS from lib/data.js if the API key / place ID is
//     missing or the request fails, so the site always renders something.
//
// Required env vars (server-only, never prefix with NEXT_PUBLIC_):
//   GOOGLE_PLACES_API_KEY   — your Google Cloud API key (Places API enabled)
//   GOOGLE_PLACE_ID         — your Google Maps place ID  (e.g. ChIJ...)
//
// Places API (New) docs:
//   https://developers.google.com/maps/documentation/places/web-service/place-details

import "server-only";

const PLACES_DETAIL_URL = "https://places.googleapis.com/v1/places";
// How many reviews to request (Places API max is 5 for the free tier).
const MAX_REVIEWS = 5;
// Revalidate cached response every 6 hours.
const REVALIDATE_SECONDS = 6 * 60 * 60;

/**
 * Normalise a Places API (New) review into the shape the Reviews component expects:
 *   { quote, name, city, destination, rating, googleAuthorUrl, isPlaceholder }
 *
 * `city` and `destination` are not in Google's data — we set sensible defaults.
 */
function normaliseReview(raw) {
  return {
    quote: raw.text?.text ?? "",
    name: raw.authorAttribution?.displayName ?? "Google Reviewer",
    city: "Raipur", // Google doesn't provide the reviewer's city
    destination: "Travel Guru Raipur", // shown as the "verified" label
    rating: raw.rating ?? 5,
    googleAuthorUrl: raw.authorAttribution?.uri ?? null,
    isPlaceholder: false,
  };
}

/**
 * Fetch up to `MAX_REVIEWS` 5-star reviews from the Google Places API.
 * Returns null if credentials are missing or the request fails.
 *
 * @returns {Promise<Array|null>}
 */
export async function fetchGoogleReviews() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId || apiKey.startsWith("your_") || placeId.startsWith("your_")) {
    console.warn(
      "[googleReviews] GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID not set — skipping API fetch."
    );
    return null;
  }

  const url = `${PLACES_DETAIL_URL}/${placeId}?languageCode=en`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Places API (New) uses X-Goog-Api-Key header instead of ?key= param.
        "X-Goog-Api-Key": apiKey,
        // Field mask: only request the fields we actually use (controls billing).
        "X-Goog-FieldMask": [
          "reviews",
          "rating",
          "userRatingCount",
        ].join(","),
      },
      // Next.js fetch extension: ISR revalidation.
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[googleReviews] Places API error", res.status, body);
      return null;
    }

    const data = await res.json();

    const reviews = (data.reviews ?? [])
      .slice(0, MAX_REVIEWS)
      .map(normaliseReview)
      // Only show reviews that have actual text.
      .filter((r) => r.quote.trim().length > 10);

    return {
      reviews,
      // Live rating from Google — overrides the static value in data.js when available.
      rating: data.rating ?? null,
      userRatingCount: data.userRatingCount ?? null,
    };
  } catch (err) {
    console.error("[googleReviews] fetch failed:", err.message);
    return null;
  }
}
