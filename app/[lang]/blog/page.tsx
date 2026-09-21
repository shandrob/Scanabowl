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
      <h1 className="font-display text-4xl font-semibold text-brand-deep">{t("blog.title")}</h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-soft">{t("blog.subtitle")}</p>
      {posts.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line bg-paper p-8 text-center text-ink-soft">{t("blog.empty")}</p>
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
