import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Crawlers that only serve their own commercial purpose (SEO-tool scanners, bulk scrapers). Every page they
 * request is rendered and stored on the server, which costs money and gives Scanabowl nothing back.
 * Search engines (Google, Bing, ...) are NOT listed here.
 */
const UNWANTED_BOTS = ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot", "PetalBot", "Bytespider", "BLEXBot", "serpstatbot"];

/**
 * Crawlers that copy whole websites to train AI models. They read every one of the ~12,000 food pages but
 * send no visitors. The AI *search* bots that do link to sources (OAI-SearchBot, ChatGPT-User, PerplexityBot,
 * Claude-SearchBot, Claude-User) stay allowed, so Scanabowl can still be found and cited through AI assistants.
 * Remove a name here to let that crawler in again.
 */
const AI_TRAINING_BOTS = ["GPTBot", "ClaudeBot", "CCBot", "meta-externalagent", "Amazonbot", "cohere-training-data-crawler", "Diffbot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: [...UNWANTED_BOTS, ...AI_TRAINING_BOTS], disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: [`${SITE.url}/sitemap.xml`, `${SITE.url}/sitemap-blog.xml`],
    host: SITE.url,
  };
}
