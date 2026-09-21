import { listPosts } from "@/lib/blog";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string);

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });
  const t = createT(await getDictionary(lang));
  const posts = listPosts(lang).slice(0, 30);
  const items = posts
    .map(
      (p) => `<item><title>${x(p.title)}</title><link>${SITE.url}${localePath(lang, `/blog/${p.slug}`)}</link><guid>${SITE.url}${localePath(lang, `/blog/${p.slug}`)}</guid><pubDate>${p.date.toUTCString()}</pubDate><description>${x(p.description)}</description></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Scanabowl - ${x(t("blog.title"))}</title><link>${SITE.url}${localePath(lang, "/blog")}</link><description>${x(t("blog.metaDescription"))}</description><language>${lang}</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600" } });
}
