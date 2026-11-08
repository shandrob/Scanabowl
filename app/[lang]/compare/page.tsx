import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompareTool } from "@/components/compare/CompareTool";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";

/** One static page: the foods to compare are read from the address (?f=...) in the browser, so no page per combination. */
export const revalidate = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/compare", t("compare.metaTitle"), t("compare.metaDescription"));
}

export default async function ComparePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = createT(await getDictionary(lang));
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
      <header className="border-b-2 border-ink pb-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">
          FEDIAF 2021 · DRY MATTER BASIS SPECIFICATION
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          {t("compare.title")}
        </h1>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("compare.intro")}</p>
      </header>
      <div className="mt-8">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-sm border border-line bg-paper" aria-hidden />}>
          <CompareTool />
        </Suspense>
      </div>
    </div>
  );
}
