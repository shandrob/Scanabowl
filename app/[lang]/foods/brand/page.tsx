import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GRADE_STYLE, gradeOf } from "@/components/ui/grade";
import { allBrands, MIN_FOODS_FOR_PAGE, MIN_SCORED_FOR_RANKING } from "@/lib/data/brands";
import { alternateLanguages, isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT, type TFunction } from "@/lib/i18n/t";

/** Brand data only changes with a deployment: built once, never refreshed on a timer. */
export const revalidate = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  const count = (await allBrands()).length;
  return {
    title: t("brandPages.indexMetaTitle"),
    description: t("brandPages.indexMetaDescription", { count }),
    alternates: { canonical: localePath(lang, "/foods/brand"), languages: alternateLanguages("/foods/brand") },
  };
}

function AvgBadge({ avg, t }: { avg: number | null; t: TFunction }) {
  const grade = gradeOf(avg);
  if (avg === null || !grade) return <span className="text-xs text-ink-faint">{t("brandPages.noAvg")}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${GRADE_STYLE[grade].soft} ${GRADE_STYLE[grade].text}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${GRADE_STYLE[grade].solid}`} aria-hidden />
      {t("brandPages.avg", { score: avg })}
    </span>
  );
}

export default async function BrandIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  if (!isLocale(l)) notFound();
  const lang: Locale = l;
  const t = createT(await getDictionary(lang));
  const brands = await allBrands();
  const ranking = brands
    .filter((b) => b.scored >= MIN_SCORED_FOR_RANKING && b.avg !== null)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0) || b.scored - a.scored)
    .slice(0, 10);
  const letters = new Map<string, typeof brands>();
  for (const b of brands) {
    const first = b.name.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(first) ? first : "#";
    letters.set(key, [...(letters.get(key) ?? []), b]);
  }
  const href = (slug: string) => localePath(lang, `/foods/brand/${slug}`);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
      <nav aria-label={t("common.breadcrumb")} className="text-sm text-ink-faint">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href={localePath(lang)} className="hover:text-brand hover:underline">{t("nav.home")}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={localePath(lang, "/foods")} className="hover:text-brand hover:underline">{t("nav.foods")}</Link></li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft" aria-current="page">{t("brandPages.indexTitle")}</li>
        </ol>
      </nav>
      <h1 className="mt-6 font-display text-4xl font-semibold text-brand-deep">{t("brandPages.indexTitle")}</h1>
      <p className="mt-3 max-w-3xl text-lg text-ink-soft">{t("brandPages.indexIntro", { min: MIN_FOODS_FOR_PAGE })}</p>

      {ranking.length > 0 && (
        <section aria-labelledby="top-h" className="mt-10 rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8">
          <h2 id="top-h" className="font-display text-2xl font-semibold text-brand-deep">{t("brandPages.topTitle")}</h2>
          <ol className="mt-5 grid gap-x-8 gap-y-3 sm:grid-flow-col sm:grid-rows-5">
            {ranking.map((b, i) => (
              <li key={b.slug} className="flex items-center gap-3">
                <span className="w-6 text-right font-mono text-sm text-ink-faint">{i + 1}.</span>
                <Link href={href(b.slug)} prefetch={false} className="min-w-0 flex-1 truncate font-semibold text-ink hover:text-brand hover:underline">{b.name}</Link>
                <AvgBadge avg={b.avg} t={t} />
              </li>
            ))}
          </ol>
          <p className="mt-5 text-xs text-ink-faint">{t("brandPages.topNote", { min: MIN_SCORED_FOR_RANKING })}</p>
        </section>
      )}

      <section aria-labelledby="az-h" className="mt-12">
        <h2 id="az-h" className="font-display text-2xl font-semibold text-brand-deep">{t("brandPages.azTitle")}</h2>
        <div className="mt-6 space-y-8">
          {[...letters.entries()].map(([letter, list]) => (
            <div key={letter}>
              <h3 className="font-mono text-sm font-semibold uppercase tracking-widest text-brand">{letter}</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((b) => (
                  <li key={b.slug}>
                    <Link href={href(b.slug)} prefetch={false} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3 transition hover:border-brand-mid/50 hover:shadow-card">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{b.name}</span>
                        <span className="block text-xs text-ink-faint">{t("brandPages.foods", { count: b.count })}</span>
                      </span>
                      <AvgBadge avg={b.avg} t={t} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
