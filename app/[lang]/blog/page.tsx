import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/BlogCard";
import { listPosts } from "@/lib/blog";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";

/** Scheduled posts appear by themselves: the list re-checks publish dates every hour. */
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/blog", t("blog.metaTitle"), t("blog.metaDescription"), {
    alternates: { canonical: `/${lang}/blog`, languages: Object.fromEntries(["nl", "en", "de", "fr"].map((l) => [l, `/${l}/blog`])), types: { "application/rss+xml": `/${lang}/blog/feed.xml` } },
  });
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = createT(await getDictionary(lang));
  const posts = listPosts(lang);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
      <header className="border-b-2 border-ink pb-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">EDITORIAL & RESEARCH JOURNAL</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t("blog.title")}</h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-soft">{t("blog.subtitle")}</p>
      </header>
      {posts.length === 0 ? (
        <p className="mt-10 rounded-sm border-2 border-dashed border-ink bg-paper p-8 text-center text-ink-soft">{t("blog.empty")}</p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <BlogCard post={p} lang={lang} t={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
