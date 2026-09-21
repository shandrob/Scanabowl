import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FoodFinder } from "@/components/foods/FoodFinder";
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
  const t = createT(await getDictionary(lang));
  const meta = metaJson as Meta;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-brand-deep">{t("finder.title")}</h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-soft">{t("finder.subtitle", { count: (meta.counts.scoredDog + meta.counts.scoredCat).toLocaleString(lang) })}</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-line/60" />}>
          <FoodFinder brands={meta.brands} />
        </Suspense>
      </div>
    </div>
  );
}
