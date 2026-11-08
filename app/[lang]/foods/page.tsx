import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FoodFinder } from "@/components/foods/FoodFinder";
import { POPULAR_FOODS, popularBrands } from "@/lib/data/popular";
import type { Meta } from "@/lib/data/types";
import metaJson from "@/data/generated/meta.json";
import { alternateLanguages, isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return {
    title: t("finder.metaTitle"),
    description: t("finder.metaDescription"),
    alternates: { canonical: localePath(lang, "/foods"), languages: alternateLanguages("/foods") },
  };
}

export default async function FoodsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [dict, popBrands] = await Promise.all([getDictionary(lang), popularBrands(18)]);
  const t = createT(dict);
  const meta = metaJson as Meta;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t("finder.title")}</h1>
          <p className="mt-2 max-w-2xl text-lg text-ink-soft">{t("finder.subtitle", { count: (meta.counts.scoredDog + meta.counts.scoredCat).toLocaleString(lang) })}</p>
        </div>
        <Link href={localePath(lang, "/foods/brand")} className="font-sans text-sm font-semibold text-brand hover:underline">
          {t("nav.allBrands")} →
        </Link>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl border border-line bg-paper" />}>
          <FoodFinder brands={meta.brands} />
        </Suspense>
      </div>

      {/* server-rendered crawlable links to popular foods and brands */}
      <section className="mt-14 border-t border-line pt-10" aria-labelledby="foods-popular-h">
        <h2 id="foods-popular-h" className="font-display text-2xl font-semibold tracking-tight text-ink">{t("home.popularTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t("home.popularSubtitle")}</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 font-sans text-xs font-semibold text-ink-soft">{t("home.popularFoodsHeading")}</h3>
            <ul className="flex flex-wrap gap-2">
              {POPULAR_FOODS.map((item) => {
                const dotColor =
                  item.score >= 75
                    ? "bg-grade-a"
                    : item.score >= 50
                      ? "bg-grade-c"
                      : "bg-grade-e";
                return (
                  <li key={item.slug}>
                    <Link
                      href={localePath(lang, `/foods/${item.slug}`)}
                      prefetch={false}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E2DDD5] bg-paper px-3.5 py-2 font-sans text-sm font-medium text-ink shadow-sm transition hover:border-brand hover:bg-brand-soft/60"
                    >
                      <span>{item.label}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2 py-0.5 font-sans text-xs font-bold tabular-nums text-ink">
                        <span className={`h-2 w-2 rounded-full ${dotColor}`} aria-hidden />
                        {item.score}/100
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-sans text-xs font-semibold text-ink-soft">{t("home.popularBrandsHeading")}</h3>
            <ul className="flex flex-wrap gap-2">
              {popBrands.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={localePath(lang, `/foods/brand/${b.slug}`)}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD5] bg-paper px-3.5 py-2 font-sans text-sm font-medium text-ink shadow-sm transition hover:border-brand hover:bg-brand-soft/60"
                  >
                    <span>{b.name}</span>
                    {b.avg !== null && <span className="font-sans text-xs font-semibold tabular-nums text-ink-faint">({b.avg})</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
