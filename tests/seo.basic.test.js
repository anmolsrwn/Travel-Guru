import { test } from "node:test";
import assert from "node:assert/strict";
import { BUSINESS } from "../lib/data.js";
import { buildMetadata, buildViewport } from "../lib/seo.js";

test("buildMetadata derives title, URLs, image and icons from BUSINESS", () => {
  const m = buildMetadata(BUSINESS);
  assert.equal(m.title, "Travel Guru Raipur · Your Journey, Our Priority", "title");
  assert.equal(m.openGraph.title, m.title, "openGraph.title");
  assert.equal(m.metadataBase.href, BUSINESS.website, "metadataBase");
  assert.equal(m.openGraph.url, BUSINESS.website, "openGraph.url");
  assert.deepEqual(
    m.openGraph.images[0],
    { url: new URL(BUSINESS.ogImage, BUSINESS.website).href, width: 1200, height: 630, alt: m.title },
    "openGraph.images[0]",
  );
  assert.equal(m.twitter.card, "summary_large_image", "twitter.card");
  assert.equal(m.icons.icon, BUSINESS.favicon, "icons.icon");
  assert.equal(m.icons.apple, BUSINESS.favicon, "icons.apple");
  assert.equal(typeof m.description, "string");
  assert.ok(m.description.length > 0, "description");
});

test("buildMetadata does not mutate its input and buildViewport returns the theme colour", () => {
  const input = structuredClone(BUSINESS);
  buildMetadata(input);
  assert.deepEqual(input, BUSINESS);
  assert.deepEqual(buildViewport(), { themeColor: "#070a1a" });
});
