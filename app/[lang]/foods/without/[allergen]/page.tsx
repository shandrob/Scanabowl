import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandCatalog } from "@/components/brands/BrandCatalog";
import { IconCheck } from "@/components/ui/Icons";
import {
  ALLERGEN_SLUGS,
  getAllergenEditorial,
  getAllergenSummary,
} from "@/lib/data/allergens";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";

export const revalidate = false;
export const dynamicParams = false;

export function generateStaticParams() {
  return ALLERGEN_SLUGS.map((allergen) => ({ allergen }));
}

type Props = { params: Promise<{ lang: string; allergen: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, allergen } = await params;
  if (!isLocale(lang)) return {};
  const data = await getAllergenSummary(allergen);
  if (!data) return {};
  const t = createT(await getDictionary(lang));
  const allergenName = t(`allergen.${data.slug}`).toLowerCase();
  return pageMeta(
    lang,
    `/foods/without/${data.slug}`,
    t("allergenPages.metaTitle", { allergen: allergenName }),
    t("allergenPages.metaDescription", { allergen: allergenName, count: data.totalSafe }),
  );
}

export default async function AllergenFreePage({ params }: Props) {
  const { lang: l, allergen } = await params;
  if (!isLocale(l)) notFound();
  const lang: Locale = l;
  const data = await getAllergenSummary(allergen);
  if (!data) notFound();

  const t = createT(await getDictionary(lang));
  const allergenLabel = t(`allergen.${data.slug}`);
  const allergenLower = allergenLabel.toLowerCase();
  const editorial = getAllergenEditorial(data.slug, lang, allergenLabel);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("allergenPages.h1", { allergen: allergenLower }),
    description: t("allergenPages.metaDescription", { allergen: allergenLower, count: data.totalSafe }),
    url: `${SITE.url}${localePath(lang, `/foods/without/${data.slug}`)}`,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">
      <nav aria-label={t("common.breadcrumb")} className="font-sans text-xs text-ink-faint">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={localePath(lang)} className="hover:text-ink hover:underline">
              {t("nav.home")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={localePath(lang, "/best")} className="hover:text-ink hover:underline">
              {t("nav.best")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft" aria-current="page">
            {t("finder.without")} {allergenLower}
          </li>
        </ol>
      </nav>

      {/* Quick Switcher Across All 10 Allergens */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {ALLERGEN_SLUGS.map((slug) => {
          const active = slug === data.slug;
          return (
            <Link
              key={slug}
              href={localePath(lang, `/foods/without/${slug}`)}
              prefetch={false}
              className={`rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "border border-line bg-paper text-ink-soft hover:border-brand-mid hover:text-ink"
              }`}
            >
              {t("finder.without")} {t(`allergen.${slug}`).toLowerCase()}
            </Link>
          );
        })}
      </div>

      {/* Hero Header */}
      <header className="mt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-grade-a-soft px-3 py-1 font-sans text-xs font-semibold text-grade-a">
          <IconCheck className="h-3.5 w-3.5" />
          {t("allergenPages.strictBadge")}
        </span>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-brand-deep sm:text-5xl">
          {t("allergenPages.h1", { allergen: allergenLower })}
        </h1>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink-soft">
          {t("allergenPages.intro", { allergen: allergenLower, count: data.totalSafe })}
        </p>
      </header>

      {/* Key Stats */}
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-paper p-5 shadow-card">
          <dt className="font-sans text-xs text-ink-faint">{t("allergenPages.statSafeTotal")}</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tabular-nums text-grade-a">{data.totalSafe}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5 shadow-card">
          <dt className="font-sans text-xs text-ink-faint">{t("allergenPages.statSafeDogs")}</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">{data.safeDogs.length}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5 shadow-card">
          <dt className="font-sans text-xs text-ink-faint">{t("allergenPages.statSafeCats")}</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">{data.safeCats.length}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5 shadow-card">
          <dt className="font-sans text-xs text-ink-faint">{t("allergenPages.statFilteredOut")}</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">
            {data.definiteCount + data.vagueCount}
          </dd>
          <dd className="mt-0.5 font-sans text-[11px] tabular-nums text-ink-faint">
            {t("allergenPages.statFilteredSub", { definite: data.definiteCount, vague: data.vagueCount })}
          </dd>
        </div>
      </dl>

      {/* Veterinary & Label Explanation */}
      <section aria-labelledby="allergen-info-h" className="mt-8 rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 id="allergen-info-h" className="font-display text-xl font-semibold tracking-tight text-brand-deep">
              {t("allergenPages.whyTitle", { allergen: allergenLower })}
            </h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-ink-soft">{editorial.whyAvoid}</p>
          </div>
          <div className="rounded-xl border border-brand/20 bg-brand-soft/40 p-5">
            <h3 className="font-display text-base font-semibold text-brand-deep">
              {t("allergenPages.vagueTitle")}
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-ink-soft">{editorial.vagueWarning}</p>
            <p className="mt-3">
              <Link
                href={localePath(lang, "/my-pet")}
                className="font-sans text-xs font-semibold text-brand hover:underline"
              >
                {t("home.persButton")} →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Full Interactive Catalog of Strictly Allergen-Free Products */}
      <BrandCatalog
        brandName={allergenLabel}
        dogItems={data.safeDogs}
        catItems={data.safeCats}
        title={t("allergenPages.catalogTitle", { allergen: allergenLower, count: data.totalSafe })}
        searchPlaceholder={t("allergenPages.searchPlaceholder", { allergen: allergenLower })}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
