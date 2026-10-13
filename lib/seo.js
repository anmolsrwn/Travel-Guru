// Document head values for app/layout.js (design 7.26, Requirement 33.3).
// Pure: no I/O, no globals, no framework imports. The input is never mutated.

/** Brand theme colour, matches the --bg-0 design token. */
export const THEME_COLOR = "#070a1a";

/** Open Graph image size in pixels (USER-SUPPLIED or generated 1200x630 image). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * Builds the Next.js `metadata` export from the BUSINESS config.
 * Title and og:title are "{brandName} · {tagline}", metadataBase and og:url are
 * BUSINESS.website, the og:image is the absolute URL of BUSINESS.ogImage on
 * BUSINESS.website, and both icons point to BUSINESS.favicon.
 * @param {object} business the BUSINESS object from lib/data.js
 * @returns {object} Next.js Metadata object
 */
export function buildMetadata(business) {
  const title = `${business.brandName} · ${business.tagline}`;
  const description =
    business.description ??
    `${business.brandName}: ${business.tagline}. ${business.motto}. Complete travel solutions under one roof.`;
  const ogImageUrl = new URL(business.ogImage, business.website).href;

  return {
    metadataBase: new URL(business.website),
    title,
    description,
    openGraph: {
      title,
      description,
      url: business.website,
      siteName: business.brandName,
      type: "website",
      images: [{ url: ogImageUrl, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    icons: {
      icon: business.favicon,
      apple: business.favicon,
    },
  };
}

/**
 * Builds the Next.js `viewport` export.
 * @returns {{ themeColor: string }}
 */
export function buildViewport() {
  return { themeColor: THEME_COLOR };
}
