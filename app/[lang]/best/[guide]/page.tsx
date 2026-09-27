import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideItem } from "@/components/guides/GuideItem";
import { IconArrow } from "@/components/ui/Icons";
import { Rich } from "@/components/ui/Rich";
import { listPosts } from "@/lib/blog";
import { allGuides, dataYear, getGuide } from "@/lib/data/guides";
import { GUIDES, PER_BRAND } from "@/lib/guides/defs";
import { guideText } from "@/lib/guides/content";
import { alternateLanguages, isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { speciesLabel } from "@/lib/labels";
import { SITE } from "@/lib/site";

/**
 * 16 guides x 4 languages, built during the deployment. The ranking only changes when the food data changes,
 * which always comes with a deployment, so the pages are never refreshed on a timer (no ISR writes).
 */
export const revalidate = false;
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ guide: g.slug }));
}

type Props = { params: Promise<{ lang: string; guide: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, guide } = await params;
  if (!isLocale(lang)) return {};
  const g = await getGuide(guide);
  if (!g) return {};
  const text = guideText(lang, guide, { year: dataYear(), count: g.candidates });
  if (!text) return {};
  const path = `/best/${guide}`;
  const image = g.top.find((p) => p.image)?.image;
  return {
    title: text.title,
    description: text.description,
    alternates: { canonical: localePath(lang, path), languages: alternateLanguages(path) },
    openGraph: { title: text.title, description: text.description, url: localePath(lang, path), ...(image ? { images: [{ url: image }] } : {}) },
  };
}

export default async function GuidePage({ params }: Props) {
  const { lang: l, guide } = await params;
  if (!isLocale(l)) notFound();
  const lang: Locale = l;
  const g = await getGuide(guide);
  if (!g) notFound();
  const t = createT(await getDictionary(lang));
  const year = dataYear();
  const text = guideText(lang, guide, { year, count: g.candidates });
  if (!text) notFound();
  const url = `${SITE.url}${localePath(lang, `/best/${guide}`)}`;

  const finder = new URLSearchParams({ species: g.def.species, ...g.def.finder });
  const compare = g.top.length >= 2 ? `${localePath(lang, "/compare")}?species=${g.def.species}&f=${g.top.slice(0, 3).map((p) => encodeURIComponent(p.id)).join(",")}` : null;
  // only posts that are already published (scheduled ones appear after the next deployment)
  const posts = listPosts(lang).filter((p) => g.def.posts.includes(p.slug));
  const others = (await allGuides()).filter((o) => o.def.slug !== guide && o.top.length > 0);
  const sameSpecies = others.filter((o) => o.def.species === g.def.species);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: text.h1,
        url,
        numberOfItems: g.top.length,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        itemListElement: g.top.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE.url}${localePath(lang, `/foods/${p.slug}`)}`,
          name: p.name,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.home"), item: `${SITE.url}${localePath(lang)}` },
          { "@type": "ListItem", position: 2, name: t("guides.indexTitle"), item: `${SITE.url}${localePath(lang, "/best")}` },
          { "@type": "ListItem", position: 3, name: text.h1, item: url },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
      <nav aria-label={t("common.breadcrumb")} className="text-sm text-ink-faint">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href={localePath(lang)} className="hover:text-brand hover:underline">{t("nav.home")}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={localePath(lang, "/best")} className="hover:text-brand hover:underline">{t("guides.indexTitle")}</Link></li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft" aria-current="page">{text.h1}</li>
        </ol>
      </nav>

      <header className="mt-6 max-w-3xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-brand">
          {speciesLabel(t, g.def.species, true)} · {t("guides.kicker", { year })}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-brand-deep sm:text-5xl">{text.h1}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft"><Rich text={text.intro} /></p>
        <p className="mt-3 text-sm text-ink-faint">{t("guides.compared", { count: g.candidates.toLocaleString(lang), brands: g.brands })}</p>
      </header>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="list-h">
          <h2 id="list-h" className="sr-only">{t("guides.listTitle", { count: g.top.length })}</h2>
          {g.top.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-paper p-8 text-center text-ink-soft">{t("guides.empty")}</p>
          ) : (
            <ol className="space-y-4">
              {g.top.map((p, i) => (
                <li key={p.id}>
                  <GuideItem p={p} rank={i + 1} def={g.def} lang={lang} t={t} />
                </li>
              ))}
            </ol>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {compare && (
              <Link href={compare} prefetch={false} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-white shadow-card transition hover:bg-brand-deep">
                {t("guides.compareTop")} <IconArrow className="h-4 w-4" />
              </Link>
            )}
            <Link href={`${localePath(lang, "/foods")}?${finder.toString()}`} prefetch={false} className="inline-flex items-center gap-2 rounded-xl border border-brand bg-paper px-5 py-2.5 font-semibold text-brand transition hover:bg-brand-tint">
              {t("guides.seeAll")}
            </Link>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-ink-faint">
            {t("order.disclosure")}{" "}
            <Link href={localePath(lang, "/affiliate")} className="underline underline-offset-2 hover:text-brand">{t("order.moreInfo")}</Link>
          </p>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="tips-h" className="rounded-2xl border border-line bg-paper p-6 shadow-card">
            <h2 id="tips-h" className="font-display text-xl font-semibold text-brand-deep">{t("guides.lookFor")}</h2>
            <ul className="mt-4 space-y-3 text-[0.95rem] leading-relaxed text-ink-soft">
              {text.tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden className="mt-0.5 text-brand">✓</span>
                  <span><Rich text={tip} /></span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="how-h" className="rounded-2xl border border-line bg-cream/60 p-6 text-sm leading-relaxed text-ink-soft">
            <h2 id="how-h" className="font-display text-base font-semibold text-brand-deep">{t("guides.howRanked")}</h2>
            <p className="mt-2"><Rich text={t("guides.howRankedText", { perBrand: PER_BRAND })} /></p>
          </section>
          {posts.length > 0 && (
            <section aria-labelledby="read-h" className="rounded-2xl border border-line bg-paper p-6">
              <h2 id="read-h" className="font-display text-base font-semibold text-brand-deep">{t("guides.readMore")}</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <Link href={localePath(lang, `/blog/${post.slug}`)} className="font-semibold text-brand underline underline-offset-2">{post.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {sameSpecies.length > 0 && (
        <section aria-labelledby="more-h" className="mt-16">
          <h2 id="more-h" className="font-display text-2xl font-semibold text-brand-deep">{t("guides.otherGuides")}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {sameSpecies.map((o) => {
              const ot = guideText(lang, o.def.slug, { year, count: o.candidates });
              return ot ? (
                <li key={o.def.slug}>
                  <Link href={localePath(lang, `/best/${o.def.slug}`)} className="inline-block rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:border-brand-mid hover:text-brand-deep">
                    {ot.h1}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
