import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alternatives } from "@/components/product/Alternatives";
import { AnalysisTable } from "@/components/product/AnalysisTable";
import { IngredientsBlock } from "@/components/product/IngredientsBlock";
import { OrderCard } from "@/components/product/OrderCard";
import { PersonalPanel } from "@/components/product/PersonalPanel";
import { ScorePanel } from "@/components/product/ScorePanel";
import { ProductImage } from "@/components/ui/ProductImage";
import { detailToIndex } from "@/lib/data/index-entry";
import { alternativesFor, getProduct } from "@/lib/data/products";
import { alternateLanguages, isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { foodTypeLabel, speciesLabel, stageLabel } from "@/lib/labels";
import { SITE } from "@/lib/site";

/**
 * Food data only changes when the site is deployed, so a rendered page is kept until the next deployment.
 * (A timed refresh re-stores ~12,000 pages again and again and burns through Vercel's ISR-write allowance.)
 */
export const revalidate = false;
/** Pages that were not pre-built are rendered on the first visit (and then cached). */
export const dynamicParams = true;

/** Pages are rendered on first visit and cached - no need to pre-build thousands of pages. */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const p = await getProduct(slug);
  if (!p) return {};
  const t = createT(await getDictionary(lang));
  const title = p.score !== null ? t("product.metaTitle", { name: p.name, score: p.score }) : p.name;
  const description = t(p.score !== null ? "product.metaDescription" : "product.metaDescriptionNoScore", {
    name: p.name,
    brand: p.brand,
    score: p.score ?? 0,
    species: speciesLabel(t, p.species),
  });
  const path = `/foods/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: localePath(lang, path), languages: alternateLanguages(path) },
    openGraph: { title, description, images: p.image ? [{ url: p.image }] : [{ url: "/og.png", width: 1200, height: 630 }] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang: l, slug } = await params;
  if (!isLocale(l)) notFound();
  const lang: Locale = l;
  const p = await getProduct(slug);
  if (!p) notFound();
  const t = createT(await getDictionary(lang));
  const [alternatives] = await Promise.all([alternativesFor(p)]);
  const entry = detailToIndex(p);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.name,
        brand: { "@type": "Brand", name: p.brand },
        ...(p.ean && p.ean.length === 13 ? { gtin13: p.ean } : {}),
        ...(p.image ? { image: `${SITE.url}${p.image}` } : {}),
        category: speciesLabel(t, p.species, true),
        description: t("product.jsonLdDescription", { name: p.name, brand: p.brand }),
        url: `${SITE.url}${localePath(lang, `/foods/${slug}`)}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.foods"), item: `${SITE.url}${localePath(lang, "/foods")}` },
          { "@type": "ListItem", position: 2, name: p.name, item: `${SITE.url}${localePath(lang, `/foods/${slug}`)}` },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
      <nav aria-label={t("common.breadcrumb")} className="text-sm text-ink-faint">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href={localePath(lang)} className="hover:text-brand hover:underline">{t("nav.home")}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`${localePath(lang, "/foods")}?species=${p.species}`} className="hover:text-brand hover:underline">{speciesLabel(t, p.species, true)}</Link></li>
          <li aria-hidden>/</li>
          <li className="max-w-[16rem] truncate text-ink-soft" aria-current="page">{p.name}</li>
        </ol>
      </nav>

      <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <ProductImage ean={p.ean} hasImage={!!p.image} alt={p.name} size={200} priority />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-brand">{p.brand}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">{p.name}</h1>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            <li className="rounded-lg border border-line bg-paper px-2.5 py-1">{speciesLabel(t, p.species)}</li>
            <li className="rounded-lg border border-line bg-paper px-2.5 py-1">{foodTypeLabel(t, p.foodType)}</li>
            <li className="rounded-lg border border-line bg-paper px-2.5 py-1">{stageLabel(t, p.lifeStage, p.species)}</li>
            {p.grainFree && <li className="rounded-lg border border-brand/30 bg-brand-tint px-2.5 py-1 text-brand-deep">{t("common.grainFree")}</li>}
            {p.pack && <li className="rounded-lg border border-line bg-paper px-2.5 py-1">{p.pack}</li>}
          </ul>
          {p.ean && <p className="mt-3 font-mono text-xs text-ink-faint">EAN {p.ean}</p>}
        </div>
      </header>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          {p.score !== null && <PersonalPanel entry={entry} species={p.species} ingredientsText={p.ingredientsText} price={p.price} />}
          <ScorePanel p={p} t={t} lang={lang} />

          <section aria-labelledby="ingr-h" className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8">
            <h2 id="ingr-h" className="font-display text-xl font-semibold text-brand-deep">{t("product.ingredientsTitle")}</h2>
            <div className="mt-4"><IngredientsBlock p={p} t={t} /></div>
          </section>

          <section aria-labelledby="an-h" className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8">
            <h2 id="an-h" className="font-display text-xl font-semibold text-brand-deep">{t("product.analysisTitle")}</h2>
            <div className="mt-4"><AnalysisTable p={p} t={t} /></div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <OrderCard ean={p.ean} name={p.name} bolUrl={p.bolUrl} lang={lang} t={t} />
          <section className="rounded-2xl border border-line bg-paper p-5 text-sm text-ink-soft">
            <h2 className="font-display text-base font-semibold text-brand-deep">{t("product.dataTitle")}</h2>
            <p className="mt-2">{t(p.source === "brand" ? "product.dataBrand" : p.source === "scraped" ? "product.dataScraped" : "product.dataPack")}</p>
            <p className="mt-2">
              <Link href={`${localePath(lang, "/suggest")}?report=${encodeURIComponent(p.ean || p.id)}&name=${encodeURIComponent(p.name)}`} className="font-semibold text-brand underline underline-offset-2">
                {t("product.reportError")}
              </Link>
            </p>
          </section>
          <p className="text-xs leading-relaxed text-ink-faint">{t("product.disclaimer")}</p>
        </aside>
      </div>

      <div className="mt-14">
        <Alternatives candidates={alternatives} species={p.species} />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
