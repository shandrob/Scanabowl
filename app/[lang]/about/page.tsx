import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LongPage } from "@/components/ui/LongPage";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createRaw, createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/about", t("about.metaTitle"), t("about.metaDescription"));
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = createT(dict);
  return <LongPage title={t("about.title")} intro={t("about.intro")} sections={createRaw(dict)("about.sections")} />;
}
