import type { MetadataRoute } from "next";
import { listPosts, postLanguages, publishedSlugs } from "@/lib/blog";
import { allProductSlugs } from "@/lib/data/products";
import { LOCALES, LOCALE_TAGS, localePath } from "@/lib/i18n/config";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

const STATIC = ["", "/foods", "/my-pet", "/blog", "/how-we-score", "/suggest", "/brands", "/about", "/contact", "/privacy", "/terms", "/affiliate"];

const url = (lang: (typeof LOCALES)[number], path: string) => `${SITE.url}${localePath(lang, path)}`;
const languages = (path: string, only = LOCALES as readonly (typeof LOCALES)[number][]) =>
  Object.fromEntries(only.map((l) => [LOCALE_TAGS[l], url(l, path)]));

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [];
  for (const path of STATIC) {
    for (const lang of LOCALES) {
      out.push({ url: url(lang, path), lastModified: now, changeFrequency: path === "" || path === "/blog" ? "weekly" : "monthly", priority: path === "" ? 1 : 0.7, alternates: { languages: languages(path) } });
    }
  }
  for (const slug of allProductSlugs()) {
    const path = `/foods/${slug}`;
    for (const lang of LOCALES) out.push({ url: url(lang, path), changeFrequency: "monthly", priority: 0.6, alternates: { languages: languages(path) } });
  }
  for (const slug of publishedSlugs()) {
    const path = `/blog/${slug}`;
    const langs = postLanguages(slug);
    for (const lang of LOCALES) {
      const post = listPosts(lang).find((p) => p.slug === slug);
      out.push({ url: url(lang, path), lastModified: post?.date, changeFrequency: "yearly", priority: 0.6, alternates: { languages: languages(path, langs) } });
    }
  }
  return out;
}
