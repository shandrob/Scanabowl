import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GradeBar } from "@/components/foods/GradeBar";
import { ProductCard } from "@/components/foods/ProductCard";
import { allBrands, getBrand, type SpeciesSummary } from "@/lib/data/brands";
import { alternateLanguages, isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT, type TFunction } from "@/lib/i18n/t";
import type { Species } from "@/lib/scoring/types";
import { SITE } from "@/lib/site";

/**
 * About 100 brand pages per language, built during the deployment (cheap, and pages built at deploy time cost
 * no ISR writes on Vercel). Brand data only changes with a deployment, so they are never refreshed on a timer.
 */
export const revalidate = false;
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await allBrands()).map((b) => ({ brand: b.slug }));
}

type Props = { params: Promise<{ lang: string; brand: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, brand: slug } = await params;
  if (!isLocale(lang)) return {};
  const b = await getBrand(slug);
  if (!b) return {};
  const t = createT(await getDictionary(lang));
  const path = `/foods/brand/${slug}`;
  return {
    title: t("brandPages.metaTitle", { brand: b.name }),
    description: t("brandPages.metaDescription", { brand: b.name, count: b.count }),
    alternates: { canonical: localePath(lang, path), languages: alternateLanguages(path) },
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-brand-deep">{value}</p>
    </div>
  );
}

function SpeciesSection({ id, title, summary, species, brand, lang, t }: { id: string; title: string; summary: SpeciesSummary; species: Species; brand: string; lang: Locale; t: TFunction }) {
  const finder = `${localePath(lang, "/foods")}?species=${species}&brand=${encodeURIComponent(brand)}`;
  return (
    <section aria-labelledby={id} className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id={id} className="font-display text-2xl font-semibold text-brand-deep">{title}</h2>
        {summary.count > summary.top.length && (
          <Link href={finder} className="text-sm font-semibold text-brand underline underline-offset-2">{t("brandPages.showAll", { count: summary.count })}</Link>
        )}
      </div>
      {summary.scored > 0 && (
        <div className="mt-4 max-w-xl">
          <GradeBar grades={summary.grades} t={t} />
        </div>
      )}
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {summary.top.map((e) => (
          <li key={e.i}>
            <ProductCard entry={e} species={species} lang={lang} t={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function BrandPage({ params }: Props) {
  const { lang: l, brand: slug } = await params;
  if (!isLocale(l)) notFound();
  const lang: Locale = l;
  const b = await getBrand(slug);
  if (!b) notFound();
  const t = createT(await getDictionary(lang));
  const topShare = b.scored ? Math.round(((b.grades.A + b.grades.B) / b.scored) * 100) : null;
  const url = `${SITE.url}${localePath(lang, `/foods/brand/${slug}`)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: t("brandPages.metaTitle", { brand: b.name }), url, about: { "@type": "Brand", name: b.name } },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.foods"), item: `${SITE.url}${localePath(lang, "/foods")}` },
          { "@type": "ListItem", position: 2, name: t("brandPages.indexTitle"), item: `${SITE.url}${localePath(lang, "/foods/brand")}` },
          { "@type": "ListItem", position: 3, name: b.name, item: url },
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
          <li><Link href={localePath(lang, "/foods/brand")} className="hover:text-brand hover:underline">{t("brandPages.indexTitle")}</Link></li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft" aria-current="page">{b.name}</li>
        </ol>
      </nav>

      <h1 className="mt-6 font-display text-4xl font-semibold text-brand-deep">{b.name}</h1>
      <p className="mt-3 max-w-3xl text-lg text-ink-soft">{t("brandPages.intro", { brand: b.name, count: b.count })}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label={t("brandPages.statFoods")} value={String(b.count)} />
        <Stat label={t("brandPages.statAvg")} value={b.avg === null ? "–" : `${b.avg}`} />
        <Stat label={t("brandPages.statBest")} value={b.best === null ? "–" : `${b.best}`} />
        <Stat label={t("brandPages.statTop")} value={topShare === null ? "–" : `${topShare}%`} />
      </div>

      {b.scored > 0 && (
        <section aria-labelledby="dist-h" className="mt-8 max-w-xl">
          <h2 id="dist-h" className="text-sm font-semibold text-ink-soft">{t("brandPages.distribution")}</h2>
          <div className="mt-2"><GradeBar grades={b.grades} t={t} /></div>
        </section>
      )}

      {b.dog && <SpeciesSection id="dogs-h" title={t("brandPages.dogsTitle", { brand: b.name })} summary={b.dog} species="dog" brand={b.name} lang={lang} t={t} />}
      {b.cat && <SpeciesSection id="cats-h" title={t("brandPages.catsTitle", { brand: b.name })} summary={b.cat} species="cat" brand={b.name} lang={lang} t={t} />}

      <div className="mt-12 max-w-3xl space-y-2 text-sm text-ink-faint">
        {b.notScored > 0 && <p>{t("brandPages.notScoredNote", { brand: b.name, count: b.notScored })}</p>}
        <p>{t("brandPages.independent", { brand: b.name })}</p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
