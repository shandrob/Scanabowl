import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard, formatDate } from "@/components/blog/BlogCard";
import { IconInfo } from "@/components/ui/Icons";
import { getPost, listPosts, postLanguages, publishedSlugs } from "@/lib/blog";
import { LOCALES, LOCALE_TAGS, isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { SITE } from "@/lib/site";

export const revalidate = 3600;
/** A post whose publish date has passed is rendered on its first visit - no rebuild needed. */
export const dynamicParams = true;

/** Posts that are already published are built ahead of time; future ones render on their first visit. */
export function generateStaticParams() {
  return publishedSlugs().flatMap((slug) => LOCALES.map((lang) => ({ lang, slug })));
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const post = getPost(lang, slug);
  if (!post) return {};
  const langs = postLanguages(slug);
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: localePath(lang, `/blog/${slug}`),
      languages: Object.fromEntries(langs.map((l) => [LOCALE_TAGS[l], localePath(l, `/blog/${slug}`)])),
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date.toISOString(),
      images: post.cover ? [{ url: post.cover }] : [{ url: "/og.png", width: 1200, height: 630 }],
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { lang: l, slug } = await params;
  if (!isLocale(l)) notFound();
  const lang: Locale = l;
  const post = getPost(lang, slug);
  if (!post) notFound();
  const t = createT(await getDictionary(lang));
  const more = listPosts(lang).filter((p) => p.slug !== slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date.toISOString(),
    inLanguage: LOCALE_TAGS[post.lang],
    image: post.cover ? `${SITE.url}${post.cover}` : `${SITE.url}/og.png`,
    author: { "@type": "Organization", name: "Scanabowl" },
    publisher: { "@type": "Organization", name: "Scanabowl", logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` } },
    mainEntityOfPage: `${SITE.url}${localePath(lang, `/blog/${slug}`)}`,
  };

  return (
    <article className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
      <nav aria-label={t("common.breadcrumb")} className="text-sm text-ink-faint">
        <Link href={localePath(lang, "/blog")} className="hover:text-brand hover:underline">← {t("blog.back")}</Link>
      </nav>
      <header className="mt-6 max-w-3xl">
        <p className="font-mono text-xs text-ink-faint">
          <time dateTime={post.date.toISOString()}>{formatDate(post.date, lang)}</time> · {t("blog.minutes", { n: post.minutes })}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-brand-deep sm:text-5xl">{post.title}</h1>
        {post.description && <p className="mt-4 text-xl leading-relaxed text-ink-soft">{post.description}</p>}
      </header>

      {!post.translated && (
        <p className="mt-6 flex max-w-3xl gap-3 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-ink">
          <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          {t("blog.notTranslated", { lang: post.lang.toUpperCase() })}
        </p>
      )}

      {post.cover && (
        <div className="relative mt-8 aspect-[16/9] max-w-4xl overflow-hidden rounded-3xl bg-brand-tint shadow-card">
          <Image src={post.cover} alt="" fill priority sizes="(min-width: 1024px) 896px, 100vw" unoptimized className="object-cover" />
        </div>
      )}

      <div className="prose-scan mt-10" dangerouslySetInnerHTML={{ __html: post.html }} />

      <aside className="mt-12 max-w-3xl rounded-2xl border border-brand/20 bg-brand-tint p-6">
        <h2 className="font-display text-xl font-semibold text-brand-deep">{t("blog.ctaTitle")}</h2>
        <p className="mt-1 text-ink-soft">{t("blog.ctaText")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={localePath(lang, "/foods")} className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-deep">{t("blog.ctaFoods")}</Link>
          <Link href={localePath(lang, "/my-pet")} className="rounded-xl border border-brand px-5 py-2.5 font-semibold text-brand hover:bg-paper">{t("blog.ctaPet")}</Link>
        </div>
      </aside>

      {more.length > 0 && (
        <section className="mt-16" aria-labelledby="more-h">
          <h2 id="more-h" className="font-display text-2xl font-semibold text-brand-deep">{t("blog.more")}</h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {more.map((p) => (
              <li key={p.slug}><BlogCard post={p} lang={lang} t={t} /></li>
            ))}
          </ul>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
