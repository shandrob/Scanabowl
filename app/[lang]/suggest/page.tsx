import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SuggestForm } from "@/components/forms/SuggestForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/suggest", t("suggest.metaTitle"), t("suggest.metaDescription"));
}

export default async function SuggestPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = createT(await getDictionary(lang));
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-12 sm:px-6">
      <header className="border-b-2 border-ink pb-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">DATABASE SUBMISSION</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">{t("suggest.title")}</h1>
        <p className="mt-3 text-lg text-ink-soft">{t("suggest.intro")}</p>
      </header>
      <div className="mt-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-sm border border-line bg-paper" />}>
          <SuggestForm />
        </Suspense>
      </div>
    </div>
  );
}
