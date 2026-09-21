import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/forms/ContactForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/contact", t("contact.metaTitle"), t("contact.metaDescription"));
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = createT(await getDictionary(lang));
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-brand-deep">{t("contact.title")}</h1>
      <p className="mt-3 text-lg text-ink-soft">
        {t("contact.intro")} <a className="font-semibold text-brand underline underline-offset-2" href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>
      <div className="mt-8"><ContactForm /></div>
    </div>
  );
}
