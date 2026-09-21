import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PetManager } from "@/components/pet/PetManager";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/my-pet", t("pet.metaTitle"), t("pet.metaDescription"));
}

export default async function MyPetPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = createT(await getDictionary(lang));
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-brand-deep">{t("pet.title")}</h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-soft">{t("pet.subtitle")}</p>
      <div className="mt-8">
        <PetManager />
      </div>
    </div>
  );
}
