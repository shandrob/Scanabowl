import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandForm } from "@/components/forms/BrandForm";
import { IconCheck, IconShield } from "@/components/ui/Icons";
import { Rich } from "@/components/ui/Rich";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createRaw, createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/brands", t("brands.metaTitle"), t("brands.metaDescription"));
}

export default async function BrandsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = createT(dict);
  const raw = createRaw(dict);
  const steps = raw<string[]>("brands.steps");
  const promises = raw<string[]>("brands.promises");
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
      <header className="border-b-2 border-ink pb-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">MANUFACTURER TRANSPARENCY PORTAL</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t("brands.title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("brands.intro")}</p>
      </header>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 lg:order-1"><BrandForm /></div>
        <aside className="order-1 space-y-6 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-sm border-2 border-ink bg-paper p-6">
            <h2 className="border-b-4 border-ink pb-2 font-display text-xl font-semibold tracking-tight text-ink">{t("brands.howTitle")}</h2>
            <ol className="mt-4 space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-ink-soft">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-ink bg-stone font-mono text-xs font-semibold text-ink">{i + 1}</span>
                  <Rich text={s} />
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-sm border-2 border-ink bg-paper p-6">
            <h2 className="border-b border-line pb-2 font-display text-xl font-semibold tracking-tight text-ink">{t("brands.csvTitle")}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft"><Rich text={t("brands.csvText")} /></p>
            <a
              href="/scanabowl-brand-template.csv"
              download="scanabowl-brand-template.csv"
              className="mt-4 inline-flex w-full items-center justify-center rounded-sm border border-ink bg-stone px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-brand-soft"
            >
              {t("brands.csvButton")}
            </a>
          </section>
          <section className="rounded-sm border-2 border-ink bg-brand-soft/60 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink"><IconShield className="h-5 w-5 text-brand" />{t("brands.promiseTitle")}</h2>
            <ul className="mt-4 space-y-3">
              {promises.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-ink"><IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-grade-a" /><Rich text={s} /></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
