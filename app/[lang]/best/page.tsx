import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrow } from "@/components/ui/Icons";
import { ProductImage } from "@/components/ui/ProductImage";
import { allGuides, dataYear, type GuideData } from "@/lib/data/guides";
import { guideText } from "@/lib/guides/content";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT, type TFunction } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";
import type { Species } from "@/lib/scoring/types";

export const revalidate = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  const year = dataYear();
  return pageMeta(lang, "/best", t("guides.indexMetaTitle", { year }), t("guides.indexMetaDescription"));
}

function GuideCard({ g, lang, t, year }: { g: GuideData; lang: Locale; t: TFunction; year: number }) {
  const text = guideText(lang, g.def.slug, { year, count: g.candidates });
  if (!text) return null;
  const first = g.top[0];
  return (
    <Link
      href={localePath(lang, `/best/${g.def.slug}`)}
      className="group flex h-full gap-4 rounded-2xl border border-line bg-paper p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-mid/50 hover:shadow-lift"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-brand-deep">{text.h1}</h3>
        <p className="mt-1 text-sm text-ink-soft">{text.card}</p>
        {first && (
          <p className="mt-3 text-sm text-ink-faint">
            {t("guides.topPick")} <span className="font-semibold text-ink-soft">{first.brand}</span> · {first.score}/100
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
          {t("guides.openList", { count: g.top.length })} <IconArrow className="h-4 w-4" />
        </span>
      </div>
      {first && (
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-white" aria-hidden>
          <ProductImage ean={first.ean} hasImage={!!first.image} alt="" size={80} />
        </div>
      )}
    </Link>
  );
}

export default async function GuidesIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  if (!isLocale(l)) notFound();
  const lang: Locale = l;
  const t = createT(await getDictionary(lang));
  const year = dataYear();
  const guides = (await allGuides()).filter((g) => g.top.length > 0);
  const section = (sp: Species, title: string) => (
    <section aria-labelledby={`${sp}-h`} className="mt-12">
      <h2 id={`${sp}-h`} className="font-display text-2xl font-semibold text-brand-deep">{title}</h2>
      <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        {guides
          .filter((g) => g.def.species === sp)
          .map((g) => (
            <li key={g.def.slug}><GuideCard g={g} lang={lang} t={t} year={year} /></li>
          ))}
      </ul>
    </section>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold leading-tight text-brand-deep sm:text-5xl">{t("guides.indexTitle")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("guides.indexIntro")}</p>
      </header>
      {section("cat", t("guides.forCats"))}
      {section("dog", t("guides.forDogs"))}
      <p className="mt-12 max-w-3xl text-sm leading-relaxed text-ink-faint">
        {t("guides.indexNote")}{" "}
        <Link href={localePath(lang, "/how-we-score")} className="underline underline-offset-2 hover:text-brand">{t("home.howScore")}</Link>
      </p>
    </div>
  );
}
