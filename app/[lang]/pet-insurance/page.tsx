import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InsuranceEstimator } from "@/components/tools/InsuranceEstimator";
import { IconCheck, IconShield } from "@/components/ui/Icons";
import { Rich } from "@/components/ui/Rich";
import { SupportBanner } from "@/components/ui/SupportBanner";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createRaw, createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/pet-insurance", t("insurance.metaTitle"), t("insurance.metaDescription"));
}

export default async function PetInsurancePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = createT(dict);
  const raw = createRaw(dict);
  const checklist = raw<string[]>("insurance.checklist");
  const exclusions = raw<string[]>("insurance.exclusions");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6">
      <nav aria-label={t("common.breadcrumb")} className="font-sans text-xs text-ink-faint">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={localePath(lang)} className="hover:text-ink hover:underline">
              {t("nav.home")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft" aria-current="page">
            {t("insurance.navTitle")}
          </li>
        </ol>
      </nav>

      <header className="mt-6 max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 font-sans text-xs font-semibold text-brand-deep">
          <IconShield className="h-3.5 w-3.5 text-brand" />
          {t("insurance.badge")}
        </span>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-brand-deep sm:text-5xl">
          {t("insurance.title")}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("insurance.intro")}</p>
      </header>

      <div className="mt-8">
        <InsuranceEstimator />
      </div>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-7">
          <h2 className="font-display text-xl font-semibold text-brand-deep">{t("insurance.checklistTitle")}</h2>
          <ul className="mt-4 space-y-3 font-sans text-sm leading-relaxed text-ink-soft">
            {checklist.map((item, idx) => (
              <li key={idx} className="flex gap-2.5">
                <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-grade-a" />
                <span><Rich text={item} /></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-7">
          <h2 className="font-display text-xl font-semibold text-ink">{t("insurance.exclusionsTitle")}</h2>
          <ul className="mt-4 space-y-3 font-sans text-sm leading-relaxed text-ink-soft">
            {exclusions.map((item, idx) => (
              <li key={idx} className="flex gap-2.5">
                <span aria-hidden className="mt-0.5 font-bold text-warn">•</span>
                <span><Rich text={item} /></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-cream/70 p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-brand-deep">{t("insurance.preventionTitle")}</h2>
        <p className="mt-2 max-w-3xl font-sans text-sm leading-relaxed text-ink-soft">{t("insurance.preventionText")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={localePath(lang, "/best")}
            className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-brand-deep"
          >
            {t("nav.best")} →
          </Link>
          <Link
            href={localePath(lang, "/my-pet")}
            className="inline-flex items-center rounded-full border border-line bg-paper px-5 py-2.5 font-sans text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-deep"
          >
            {t("nav.myPet")}
          </Link>
        </div>
      </section>

      <SupportBanner lang={lang} t={t} />
    </div>
  );
}
