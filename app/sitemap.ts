import type { MetadataRoute } from "next";
import { allProductSlugs } from "@/lib/data/products";
import { LOCALES, LOCALE_TAGS, localePath } from "@/lib/i18n/config";
import { SITE } from "@/lib/site";

/**
 * This sitemap is built once per deployment and then served as a plain file. Keep it that way:
 *  - no `revalidate` and no `new Date()`: a sitemap that changes on every request is re-stored on every
 *    revalidation, and at ~12,000 URLs that used up Vercel's free "ISR write" allowance in days;
 *  - no per-food hreflang links: every food page already declares its language versions in its own
 *    <head>, and repeating them here made this file 9 MB.
 * Blog posts live in /sitemap-blog.xml because they appear on their publish date, without a deployment.
 */

const STATIC = ["", "/foods", "/my-pet", "/blog", "/how-we-score", "/suggest", "/brands", "/about", "/contact", "/privacy", "/terms", "/affiliate"];

const url = (lang: (typeof LOCALES)[number], path: string) => `${SITE.url}${localePath(lang, path)}`;
const languages = (path: string) => Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], url(l, path)]));

export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const path of STATIC) {
    for (const lang of LOCALES) {
      out.push({ url: url(lang, path), changeFrequency: path === "" || path === "/blog" ? "weekly" : "monthly", priority: path === "" ? 1 : 0.7, alternates: { languages: languages(path) } });
    }
  }
  for (const slug of allProductSlugs()) {
    for (const lang of LOCALES) out.push({ url: url(lang, `/foods/${slug}`), changeFrequency: "monthly", priority: 0.6 });
  }
  return out;
}
