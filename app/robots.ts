import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Crawlers that only serve their own commercial purpose (SEO-tool scanners, bulk scrapers). Every page they
 * request is rendered and stored on the server, which costs money and gives Scanabowl nothing back.
 * Search engines (Google, Bing, ...) and AI assistants are NOT listed here.
 */
const UNWANTED_BOTS = ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot", "PetalBot", "Bytespider", "BLEXBot", "serpstatbot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: UNWANTED_BOTS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: [`${SITE.url}/sitemap.xml`, `${SITE.url}/sitemap-blog.xml`],
    host: SITE.url,
  };
}
