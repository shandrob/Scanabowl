import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabelDecoder } from "@/components/tools/LabelDecoder";
import { IconShield } from "@/components/ui/Icons";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";

export const revalidate = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/label-decoder", t("decoder.metaTitle"), t("decoder.metaDescription"));
}

export default async function LabelDecoderPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = createT(await getDictionary(lang));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6">
      <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 font-sans text-xs font-semibold text-brand-deep shadow-sm">
        <IconShield className="h-4 w-4 text-brand" /> {t("decoder.badge")}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-brand-deep sm:text-5xl">
        {t("decoder.title")}
      </h1>
      <p className="mt-3 max-w-3xl font-sans text-lg leading-relaxed text-ink-soft">{t("decoder.intro")}</p>

      <div className="mt-8">
        <LabelDecoder />
      </div>
    </div>
  );
}
