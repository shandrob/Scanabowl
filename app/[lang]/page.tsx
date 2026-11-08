import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/BlogCard";
import { ProductCard } from "@/components/foods/ProductCard";
import { SearchBox } from "@/components/foods/SearchBox";
import { IconArrow, IconBarcode, IconCheck, IconPaw, IconSearch, IconShield } from "@/components/ui/Icons";
import { listPosts } from "@/lib/blog";
import { detailToIndex } from "@/lib/data/index-entry";
import { HERO_EXAMPLES, POPULAR_FOODS, popularBrands } from "@/lib/data/popular";
import { productCounts, topProducts } from "@/lib/data/products";
import { GUIDE_TEXT } from "@/lib/guides/content";
import { GUIDES } from "@/lib/guides/defs";
import { LOCALE_TAGS, alternateLanguages, isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createRaw, createT } from "@/lib/i18n/t";
import { Rich } from "@/components/ui/Rich";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return {
    title: { absolute: t("meta.title") },
    description: t("meta.description"),
    alternates: { canonical: localePath(lang), languages: alternateLanguages() },
  };
}

const EXAMPLE_DOT: Record<(typeof HERO_EXAMPLES)[number]["key"], string> = {
  exampleLow: "bg-grade-e",
  exampleMid: "bg-grade-c",
  exampleHigh: "bg-grade-a",
};

function scorePillClass(score: number): string {
  if (score >= 75) return "bg-grade-a-soft text-grade-a";
  if (score >= 50) return "bg-grade-c-soft text-grade-c";
  return "bg-grade-e-soft text-grade-e";
}

function scoreDotClass(score: number): string {
  if (score >= 75) return "bg-grade-a";
  if (score >= 50) return "bg-grade-c";
  return "bg-grade-e";
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = createT(dict);
  const raw = createRaw(dict);
  const [counts, dogs, cats, popBrands] = await Promise.all([
    productCounts(),
    topProducts("dog", 3),
    topProducts("cat", 3),
    popularBrands(18),
  ]);
  const posts = listPosts(lang).slice(0, 3);
  const faq = raw<Array<{ q: string; a: string }>>("home.faq");

  const steps = [
    { icon: <IconSearch className="h-6 w-6" />, title: t("home.step1Title"), text: t("home.step1Text") },
    { icon: <IconShield className="h-6 w-6" />, title: t("home.step2Title"), text: t("home.step2Text") },
    { icon: <IconPaw className="h-6 w-6" />, title: t("home.step3Title"), text: t("home.step3Text") },
  ];

  const sciencePoints = [
    { title: t("home.scienceBullet1Title"), text: t("home.scienceBullet1Text") },
    { title: t("home.scienceBullet2Title"), text: t("home.scienceBullet2Text") },
    { title: t("home.scienceBullet3Title"), text: t("home.scienceBullet3Text") },
  ];

  // Site-wide facts for search engines live on the home page only (not repeated in every page's HTML)
  const faqLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Scanabowl", url: SITE.url, logo: `${SITE.url}/logo.png`, email: SITE.email },
      {
        "@type": "WebSite",
        name: "Scanabowl",
        url: `${SITE.url}${localePath(lang)}`,
        inLanguage: LOCALE_TAGS[lang],
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE.url}${localePath(lang, "/foods")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\*\*|\[([^\]]+)\]\([^)]+\)/g, "$1") } })),
      },
    ],
  };

  return (
    <>
      {/* Hero Section */}
      <section className="border-b border-line bg-cream">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:pb-20 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 font-sans text-sm font-medium text-brand-deep shadow-sm">
              <IconShield className="h-4 w-4 text-brand" /> {t("home.badge")}
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-brand-deep sm:text-5xl lg:text-[3.35rem]">
              {t("home.title")}
            </h1>
            <p className="mt-4 max-w-xl font-sans text-lg leading-relaxed text-ink-soft">{t("home.subtitle")}</p>

            <div className="mt-7 max-w-2xl">
              <SearchBox />
              <p className="mt-3 flex items-center gap-2 font-sans text-sm text-ink-soft">
                <IconBarcode className="h-4 w-4 shrink-0 text-brand" /> {t("home.searchHint")}
              </p>

              {/* Interactive Example Chips ("Try an example") with colored score dots */}
              <div className="mt-5">
                <p className="font-sans text-sm font-medium text-ink-soft">{t("home.examplesLabel")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {HERO_EXAMPLES.map((ex) => (
                    <Link
                      key={ex.slug}
                      href={localePath(lang, `/foods/${ex.slug}`)}
                      prefetch={false}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E2DDD5] bg-paper px-3.5 py-2 font-sans text-sm font-medium text-ink shadow-sm transition hover:border-brand-mid hover:bg-brand-soft hover:text-brand-deep"
                    >
                      <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${EXAMPLE_DOT[ex.key]}`} aria-hidden />
                      <span>{t(`home.${ex.key}`)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Category Pills */}
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href={`${localePath(lang, "/foods")}?species=dog`}
                className="rounded-lg border border-[#E2DDD5] bg-paper px-4 py-2.5 font-sans text-sm font-semibold text-brand-deep shadow-sm transition hover:border-brand-mid hover:bg-brand-soft"
              >
                {t("home.browseDogs")}
              </Link>
              <Link
                href={`${localePath(lang, "/foods")}?species=cat`}
                className="rounded-lg border border-[#E2DDD5] bg-paper px-4 py-2.5 font-sans text-sm font-semibold text-brand-deep shadow-sm transition hover:border-brand-mid hover:bg-brand-soft"
              >
                {t("home.browseCats")}
              </Link>
              <Link
                href={localePath(lang, "/foods/brand")}
                className="rounded-lg border border-[#E2DDD5] bg-paper px-4 py-2.5 font-sans text-sm font-semibold text-brand-deep shadow-sm transition hover:border-brand-mid hover:bg-brand-soft"
              >
                {t("nav.allBrands")}
              </Link>
              <Link
                href={localePath(lang, "/my-pet")}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deep"
              >
                <IconPaw className="h-4 w-4" /> {t("home.ctaPet")}
              </Link>
            </div>
          </div>

          {/* Friendly, Human-Readable Trust Card */}
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            <div className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-7">
              <div className="flex items-center gap-4">
                <Image src="/logo.png" alt="" width={60} height={60} priority className="rounded-xl border border-line" />
                <div>
                  <span className="inline-block rounded-full bg-brand-soft px-3 py-0.5 font-sans text-xs font-semibold text-brand-deep">
                    {t("home.engineerBadge")}
                  </span>
                  <h2 className="mt-1 font-display text-xl font-semibold leading-snug text-brand-deep">
                    {t("home.howTitle")}
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-cream p-4">
                  <dt className="font-sans text-xs font-medium text-ink-soft">{t("home.statFoods")}</dt>
                  <dd className="mt-1 font-sans text-2xl font-bold tabular-nums text-brand-deep">
                    {counts.products.toLocaleString(lang)}
                  </dd>
                </div>
                <div className="rounded-xl border border-line bg-cream p-4">
                  <dt className="font-sans text-xs font-medium text-ink-soft">{t("home.statBrands")}</dt>
                  <dd className="mt-1 font-sans text-2xl font-bold tabular-nums text-brand-deep">
                    {counts.brands}
                  </dd>
                </div>
              </div>

              <ul className="mt-5 space-y-2.5 font-sans text-sm text-ink-soft">
                <li className="flex items-start gap-2.5">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-grade-a" />
                  <span>{t("home.scienceBullet1Title")}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-grade-a" />
                  <span>{t("home.scienceBullet2Title")}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-grade-a" />
                  <span>{t("home.scienceBullet3Title")}</span>
                </li>
              </ul>

              <div className="mt-5 border-t border-line pt-4">
                <Link
                  href={localePath(lang, "/how-we-score")}
                  className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand hover:underline"
                >
                  {t("home.howScore")} <IconArrow className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Scanabowl Works + Science-Based Score (Vertical stack on mobile, 3 columns on md+) */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16" aria-labelledby="how-h">
        <h2 id="how-h" className="font-display text-3xl font-semibold leading-tight text-brand-deep">
          {t("home.howTitle")}
        </h2>

        <ol className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={i} className="rounded-xl border border-line bg-paper p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                  {s.icon}
                </span>
                <span className="rounded-full bg-stone px-3 py-1 font-sans text-xs font-semibold text-ink-soft">
                  {t("home.step", { n: i + 1 })}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-ink">{s.title}</h3>
              <p className="mt-2 font-sans text-[0.95rem] leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>

        {/* How does our science-based score work? */}
        <div className="mt-10 rounded-2xl border border-line bg-brand-tint p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl font-semibold leading-tight text-brand-deep">
              {t("home.scienceTitle")}
            </h3>
            <Link
              href={localePath(lang, "/how-we-score")}
              className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand hover:underline"
            >
              {t("home.howScore")} <IconArrow className="h-4 w-4" />
            </Link>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {sciencePoints.map((pt, i) => (
              <li key={i} className="rounded-xl border border-line bg-paper p-5 shadow-card">
                <p className="flex items-start gap-2 font-display text-lg font-semibold leading-snug text-brand-deep">
                  <IconCheck className="mt-1 h-5 w-5 shrink-0 text-grade-a" />
                  <span>{pt.title}</span>
                </p>
                <p className="mt-2 font-sans text-sm leading-relaxed text-ink-soft">{pt.text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-sans text-sm leading-relaxed text-ink">
              <span className="mr-2 inline-block rounded-full bg-brand px-3 py-0.5 font-sans text-xs font-semibold text-white">
                {t("home.engineerBadge")}
              </span>
              {t("home.engineerText")}
            </p>
            <Link
              href={localePath(lang, "/about")}
              className="shrink-0 font-sans text-sm font-semibold text-brand hover:underline"
            >
              {t("nav.about")} →
            </Link>
          </div>
        </div>
      </section>

      {/* Highest Scored Foods */}
      <section className="border-y border-line bg-paper" aria-labelledby="top-h">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="top-h" className="font-display text-3xl font-semibold leading-tight text-brand-deep">
                {t("home.topTitle")}
              </h2>
              <p className="mt-2 max-w-2xl font-sans text-ink-soft">{t("home.topText")}</p>
            </div>
            <Link
              href={localePath(lang, "/how-we-score")}
              className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand hover:underline"
            >
              {t("home.howScore")} <IconArrow className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {([["dog", dogs], ["cat", cats]] as const).map(([sp, list]) => (
              <div key={sp}>
                <h3 className="mb-3 font-display text-xl font-semibold text-ink">
                  {t(sp === "dog" ? "home.topDogs" : "home.topCats")}
                </h3>
                <ul className="space-y-3">
                  {list.map((p) => (
                    <li key={p.id}>
                      <ProductCard entry={detailToIndex(p)} species={sp} lang={lang} t={t} />
                    </li>
                  ))}
                </ul>
                <Link
                  href={`${localePath(lang, "/foods")}?species=${sp}`}
                  className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand hover:underline"
                >
                  {t(sp === "dog" ? "home.allDogs" : "home.allCats")} <IconArrow className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Food For ... Guides */}
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-16" aria-labelledby="guides-h">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="guides-h" className="font-display text-3xl font-semibold leading-tight text-brand-deep">
              {t("home.guidesTitle")}
            </h2>
            <p className="mt-2 max-w-2xl font-sans text-ink-soft">{t("home.guidesText")}</p>
          </div>
          <Link
            href={localePath(lang, "/best")}
            className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand hover:underline"
          >
            {t("home.guidesAll")} <IconArrow className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {(["cat", "dog"] as const).map((sp) => (
            <div key={sp} className="rounded-xl border border-line bg-paper p-5 shadow-card">
              <h3 className="mb-3 font-sans text-sm font-semibold text-brand-deep">
                {t(sp === "cat" ? "guides.forCats" : "guides.forDogs")}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {GUIDES.filter((g) => g.species === sp).map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={localePath(lang, `/best/${g.slug}`)}
                      className="inline-block rounded-full border border-[#E2DDD5] bg-cream px-3.5 py-2 font-sans text-sm font-medium text-ink transition hover:border-brand-mid hover:bg-brand-soft hover:text-brand-deep"
                    >
                      {GUIDE_TEXT[lang][g.slug]?.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Personalise for Your Pet */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16" aria-labelledby="pers-h">
        <div className="grid grid-cols-1 items-center gap-8 rounded-2xl bg-brand-deep p-7 text-white shadow-lift sm:p-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <h2 id="pers-h" className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              {t("home.persTitle")}
            </h2>
            <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-white/90 sm:text-lg">
              {t("home.persText")}
            </p>
            <Link
              href={localePath(lang, "/my-pet")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-paper px-6 py-3 font-sans text-sm font-semibold text-brand-deep shadow-sm transition hover:bg-brand-soft sm:text-base"
            >
              <IconPaw className="h-5 w-5 text-brand" /> {t("home.persButton")}
            </Link>
          </div>
          <ul className="space-y-3 rounded-xl bg-white/10 p-5 font-sans text-sm text-white/95 sm:text-base">
            {(["home.persA", "home.persB", "home.persC", "home.persD"] as const).map((k) => (
              <li key={k} className="flex gap-3">
                <span aria-hidden className="font-bold text-brand-soft">✓</span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-16" aria-labelledby="blog-h">
          <div className="flex items-end justify-between gap-3">
            <h2 id="blog-h" className="font-display text-3xl font-semibold leading-tight text-brand-deep">
              {t("home.blogTitle")}
            </h2>
            <Link
              href={localePath(lang, "/blog")}
              className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand hover:underline"
            >
              {t("home.allPosts")} <IconArrow className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <li key={p.slug}>
                <BlogCard post={p} lang={lang} t={t} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      <section className="border-t border-line bg-paper" aria-labelledby="faq-h">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 id="faq-h" className="font-display text-3xl font-semibold leading-tight text-brand-deep">
            {t("home.faqTitle")}
          </h2>
          <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-cream/60">
            {faq.map((f, i) => (
              <details key={i} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-sans text-base font-semibold text-ink">
                  <span>{f.q}</span>
                  <span aria-hidden className="text-xl text-brand transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 font-sans text-[0.95rem] leading-relaxed text-ink-soft">
                  <Rich text={f.a.replaceAll("{lang}", lang)} />
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Foods & Brands for Quick Discovery */}
      <section className="border-t border-line bg-stone/60" aria-labelledby="popular-h">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="popular-h" className="font-display text-2xl font-semibold leading-tight text-brand-deep sm:text-3xl">
                {t("home.popularTitle")}
              </h2>
              <p className="mt-1.5 max-w-2xl font-sans text-sm text-ink-soft sm:text-base">
                {t("home.popularSubtitle")}
              </p>
            </div>
            <Link
              href={localePath(lang, "/foods/brand")}
              className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand hover:underline"
            >
              {t("nav.allBrands")} ({counts.brands}) <IconArrow className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-sans text-sm font-semibold text-ink-soft">
                {t("home.popularFoodsHeading")}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {POPULAR_FOODS.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={localePath(lang, `/foods/${item.slug}`)}
                      prefetch={false}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E2DDD5] bg-paper px-3.5 py-2 font-sans text-sm font-medium text-ink shadow-sm transition hover:border-brand-mid hover:text-brand-deep"
                    >
                      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${scoreDotClass(item.score)}`} aria-hidden />
                      <span>{item.label}</span>
                      <span className={`rounded-full px-2 py-0.5 font-sans text-xs font-bold tabular-nums ${scorePillClass(item.score)}`}>
                        {item.score}/100
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-sans text-sm font-semibold text-ink-soft">
                {t("home.popularBrandsHeading")}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {popBrands.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={localePath(lang, `/foods/brand/${b.slug}`)}
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD5] bg-paper px-3.5 py-2 font-sans text-sm font-medium text-ink shadow-sm transition hover:border-brand-mid hover:bg-brand-soft hover:text-brand-deep"
                    >
                      <span>{b.name}</span>
                      {b.avg !== null && (
                        <span className="font-sans text-xs font-semibold tabular-nums text-ink-faint">({b.avg})</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Submission Banner */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-paper p-6 shadow-card sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-brand-deep">{t("home.brandTitle")}</h2>
            <p className="mt-1 max-w-2xl font-sans text-ink-soft">{t("home.brandText")}</p>
          </div>
          <Link
            href={localePath(lang, "/brands")}
            className="shrink-0 rounded-lg border border-brand bg-paper px-5 py-2.5 font-sans text-sm font-semibold text-brand transition hover:bg-brand-soft"
          >
            {t("home.brandButton")}
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <span className="hidden">{SITE.name}</span>
    </>
  );
}
