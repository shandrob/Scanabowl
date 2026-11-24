import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandCatalog } from "@/components/brands/BrandCatalog";
import { GradeBar } from "@/components/foods/GradeBar";
import { ProductCard } from "@/components/foods/ProductCard";
import { Rich } from "@/components/ui/Rich";
import { allBrands, getBrand } from "@/lib/data/brands";
import { getBrandStory } from "@/lib/data/brand-stories";
import { alternateLanguages, isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { foodTypeLabel } from "@/lib/labels";
import { SITE } from "@/lib/site";

/**
 * Brand pages built during the deployment (cheap, and pages built at deploy time cost
 * no ISR writes on Vercel). Brand data only changes with a deployment, so they are never refreshed on a timer.
 */
export const revalidate = false;
export const dynamicParams = true;

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

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-4 shadow-card">
      <p className="font-sans text-xs font-medium text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-brand-deep">{value}</p>
      {sub && <p className="mt-0.5 font-sans text-xs tabular-nums text-ink-faint">{sub}</p>}
    </div>
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
  const story = getBrandStory(b, lang);
  const brandsAll = await allBrands();
  const sisterBrands = story.sharedProducer
    ? brandsAll.filter((other) => story.sharedProducer!.sisterSlugs.includes(other.slug))
    : [];
  const comparePeers = (() => {
    if (!b.bestFood) return [];
    const sp = b.bestFood.species;
    const curated = new Set([
      "royal-canin", "prins", "edgard-en-cooper", "orijen", "acana", "farm-food",
      "carocroc", "hill-s", "purina-one", "carnilove", "applaws", "renske", "cavom", "bf-petfood",
    ]);
    const candidates = brandsAll.filter((other) => {
      if (other.slug === b.slug) return false;
      const otherTop = other[sp]?.top.find((e) => e.sc !== null);
      return Boolean(otherTop);
    });
    const sisterSet = new Set(sisterBrands.map((s) => s.slug));
    const sorted = [...candidates].sort((x, y) => {
      const xs = sisterSet.has(x.slug) ? 2 : curated.has(x.slug) ? 1 : 0;
      const ys = sisterSet.has(y.slug) ? 2 : curated.has(y.slug) ? 1 : 0;
      if (ys !== xs) return ys - xs;
      return Math.abs((x.avg ?? 60) - (b.avg ?? 60)) - Math.abs((y.avg ?? 60) - (b.avg ?? 60));
    });
    return sorted.slice(0, 5).map((other) => ({
      slug: other.slug,
      name: other.name,
      species: sp,
      otherId: other[sp]!.top.find((e) => e.sc !== null)!.i,
      myId: b.bestFood!.entry.i,
    }));
  })();
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
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">
      <nav aria-label={t("common.breadcrumb")} className="font-sans text-xs text-ink-faint">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href={localePath(lang)} className="hover:text-ink hover:underline">{t("nav.home")}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={localePath(lang, "/foods/brand")} className="hover:text-ink hover:underline">{t("brandPages.indexTitle")}</Link></li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft" aria-current="page">{b.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-brand-deep sm:text-5xl">{b.name}</h1>
        {story.origin && (
          <span className="rounded-full bg-brand-soft px-3 py-1 font-sans text-xs font-semibold text-brand-deep">
            {story.origin}
          </span>
        )}
      </div>
      <p className="mt-3 max-w-3xl font-sans text-lg leading-relaxed text-ink-soft">
        {t("brandPages.intro", { brand: b.name, count: b.count })}
      </p>

      {/* Key Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label={t("brandPages.statFoods")} value={String(b.count)} sub={b.scored > 0 ? `${b.scored} ${t("brandPages.scoredCount")}` : undefined} />
        <Stat label={t("brandPages.statAvg")} value={b.avg === null ? "–" : `${b.avg}/100`} />
        <Stat label={t("brandPages.statBest")} value={b.best === null ? "–" : `${b.best}/100`} sub={b.lowest !== null && b.lowest !== b.best ? `${t("brandPages.statLowest")}: ${b.lowest}/100` : undefined} />
        <Stat label={t("brandPages.statTop")} value={topShare === null ? "–" : `${topShare}%`} />
      </div>

      {/* About the Brand & Nutritional Profile */}
      <section aria-labelledby="about-brand-h" className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-7">
          <h2 id="about-brand-h" className="font-display text-2xl font-semibold tracking-tight text-brand-deep">
            {t("brandPages.aboutTitle", { brand: b.name })}
          </h2>
          {story.curated && (
            <p className="mt-3 font-sans text-[0.975rem] leading-relaxed text-ink">
              {story.curated}
            </p>
          )}
          <p className="mt-3 font-sans text-[0.95rem] leading-relaxed text-ink-soft">
            <Rich text={story.dataSummary} />
          </p>

          {story.sharedProducer && sisterBrands.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="font-sans text-xs font-semibold text-ink-soft">{t("brandPages.sameFactoryTitle")}</p>
              <p className="mt-1.5 font-sans text-[0.925rem] leading-relaxed text-ink-soft">
                {story.sharedProducer.note}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {sisterBrands.map((other) => (
                  <Link
                    key={other.slug}
                    href={localePath(lang, `/foods/brand/${other.slug}`)}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD5] bg-cream px-3.5 py-1.5 font-sans text-xs font-medium text-ink transition hover:border-brand/40 hover:text-brand"
                  >
                    <span>{other.name}</span>
                    <span className="font-semibold tabular-nums text-ink-soft">({other.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Food Type Breakdown Pills */}
          {b.byType.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="font-sans text-xs font-semibold text-ink-soft">{t("brandPages.rangeByType")}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {b.byType.map((bt) => (
                  <span
                    key={bt.type}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E2DDD5] bg-cream px-3.5 py-1.5 font-sans text-xs font-medium text-ink"
                  >
                    <span>{foodTypeLabel(t, bt.type)}</span>
                    <span className="font-semibold tabular-nums text-ink-soft">({bt.count})</span>
                    {bt.avg !== null && (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 font-bold tabular-nums text-brand-deep">
                        {bt.avg}/100
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Score Distribution & Average Pillar Profile */}
        <div className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-7">
          {b.scored > 0 ? (
            <>
              <h2 className="font-sans text-xs font-semibold text-ink-soft">{t("brandPages.distribution")}</h2>
              <div className="mt-2.5">
                <GradeBar grades={b.grades} t={t} />
              </div>

              {b.avgPillars && (
                <div className="mt-6 border-t border-line pt-5">
                  <h3 className="font-sans text-xs font-semibold text-ink-soft">{t("brandPages.avgPillarsTitle")}</h3>
                  <dl className="mt-3 space-y-3">
                    {([
                      ["nutrition", b.avgPillars.nutrition, 35],
                      ["ingredients", b.avgPillars.ingredients, 50],
                      ["formulation", b.avgPillars.formulation, 15],
                    ] as const).map(([key, pts, max]) => {
                      const pct = Math.round((pts / max) * 100);
                      return (
                        <div key={key}>
                          <div className="flex items-baseline justify-between font-sans text-xs">
                            <dt className="font-medium text-ink">{t(`score.pillars.${key}`)}</dt>
                            <dd className="font-semibold tabular-nums text-brand-deep">
                              {pts} / {max}
                            </dd>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              )}
            </>
          ) : (
            <p className="font-sans text-sm text-ink-soft">{t("brandPages.noAvg")}</p>
          )}
        </div>
      </section>

      {/* Best & Lowest Rated Highlights */}
      {b.bestFood && b.lowestFood && (
        <section aria-labelledby="highlights-h" className="mt-10">
          <h2 id="highlights-h" className="font-display text-2xl font-semibold tracking-tight text-brand-deep">
            {t("brandPages.highlightsTitle", { brand: b.name })}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-grade-a-soft px-3 py-1 font-sans text-xs font-semibold text-grade-a">
                ★ {t("brandPages.bestRatedFood")}
              </p>
              <ProductCard entry={b.bestFood.entry} species={b.bestFood.species} lang={lang} t={t} />
            </div>
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-stone px-3 py-1 font-sans text-xs font-semibold text-ink-soft">
                {t("brandPages.lowestRatedFood")}
              </p>
              <ProductCard entry={b.lowestFood.entry} species={b.lowestFood.species} lang={lang} t={t} />
            </div>
          </div>
        </section>
      )}

      {/* Compare with Popular Peer Brands */}
      {comparePeers.length > 0 && (
        <section aria-labelledby="compare-brands-h" className="mt-8 rounded-2xl border border-line bg-paper p-5 shadow-card sm:p-6">
          <h2 id="compare-brands-h" className="font-sans text-xs font-semibold text-ink-soft">
            {t("brandPages.compareWithTitle", { brand: b.name })}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {comparePeers.map((peer) => (
              <Link
                key={peer.slug}
                href={`${localePath(lang, "/compare")}?species=${peer.species}&f=${encodeURIComponent(peer.myId)},${encodeURIComponent(peer.otherId)}`}
                prefetch={false}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD5] bg-cream px-3.5 py-1.5 font-sans text-xs font-medium text-ink transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand-deep"
              >
                <span>{b.name} vs. {peer.name}</span>
                <span aria-hidden className="text-brand">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Products of This Brand on One Single Page */}
      <BrandCatalog
        brandName={b.name}
        dogItems={b.dog?.top ?? []}
        catItems={b.cat?.top ?? []}
      />

      <div className="mt-12 max-w-3xl space-y-2 font-sans text-xs text-ink-faint">
        {b.notScored > 0 && <p>{t("brandPages.notScoredNote", { brand: b.name, count: b.notScored })}</p>}
        <p>{t("brandPages.independent", { brand: b.name })}</p>
        <p>
          {t("brandPages.brandRepText", { brand: b.name })}{" "}
          <Link href={`${localePath(lang, "/brands")}#b2b`} className="font-semibold text-brand hover:underline">
            {t("brandPages.brandRepCta")} →
          </Link>
        </p>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
