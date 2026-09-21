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
      <h1 className="font-display text-4xl font-semibold text-brand-deep">{t("suggest.title")}</h1>
      <p className="mt-3 text-lg text-ink-soft">{t("suggest.intro")}</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-line/60" />}>
          <SuggestForm />
        </Suspense>
      </div>
    </div>
  );
}
