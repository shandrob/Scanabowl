import { listPosts, postLanguages, publishedSlugs } from "@/lib/blog";
import { LOCALES, LOCALE_TAGS, localePath, type Locale } from "@/lib/i18n/config";
import { SITE } from "@/lib/site";

/**
 * Only the blog is listed here: a scheduled post shows up on its publish date without a new deployment, so
 * this small file is refreshed hourly. It is deterministic (dates come from the posts, never from "now"),
 * so an hourly refresh with nothing new costs nothing.
 */
export const revalidate = 3600;

const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string);
const url = (lang: Locale, path: string) => `${SITE.url}${localePath(lang, path)}`;

export function GET() {
  const entries: string[] = [];
  for (const slug of publishedSlugs()) {
    const path = `/blog/${slug}`;
    const langs = postLanguages(slug);
    const alternates = langs.map((l) => `<xhtml:link rel="alternate" hreflang="${LOCALE_TAGS[l]}" href="${x(url(l, path))}"/>`).join("");
    for (const lang of LOCALES) {
      const post = listPosts(lang).find((p) => p.slug === slug);
      const lastmod = post ? `<lastmod>${post.date.toISOString()}</lastmod>` : "";
      entries.push(`<url><loc>${x(url(lang, path))}</loc>${lastmod}<changefreq>yearly</changefreq><priority>0.6</priority>${alternates}</url>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join("")}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600" } });
}
