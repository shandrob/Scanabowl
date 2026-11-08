import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/BlogCard";
import { ProductCard } from "@/components/foods/ProductCard";
import { SearchBox } from "@/components/foods/SearchBox";
import { IconArrow, IconBarcode, IconPaw, IconSearch, IconShield } from "@/components/ui/Icons";
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
    { icon: <IconSearch className="h-5 w-5" />, title: t("home.step1Title"), text: t("home.step1Text") },
    { icon: <IconShield className="h-5 w-5" />, title: t("home.step2Title"), text: t("home.step2Text") },
    { icon: <IconPaw className="h-5 w-5" />, title: t("home.step3Title"), text: t("home.step3Text") },
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
      {/* Hero Dossier Header */}
      <section className="border-b-2 border-ink bg-cream">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-start gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] lg:pb-20 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-sm border border-ink bg-paper px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-ink">
              <IconShield className="h-3.5 w-3.5 text-brand" /> {t("home.badge")}
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
              {t("home.title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t("home.subtitle")}</p>
            <div className="mt-8 max-w-2xl">
              <SearchBox />
              <p className="mt-3 flex items-center gap-2 font-mono text-xs text-ink-soft">
                <IconBarcode className="h-4 w-4 text-ink" /> {t("home.searchHint")}
              </p>
              <div className="mt-5 border-t border-line pt-4">
                <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-widest text-ink-faint">{t("home.examplesLabel")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {HERO_EXAMPLES.map((ex) => (
                    <Link
                      key={ex.slug}
                      href={localePath(lang, `/foods/${ex.slug}`)}
                      prefetch={false}
                      className="inline-flex items-center rounded-sm border border-ink bg-paper px-3 py-1 font-mono text-xs font-medium text-ink transition hover:bg-brand-soft hover:text-brand-deep"
                    >
                      {t(`home.${ex.key}`)} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href={`${localePath(lang, "/foods")}?species=dog`} className="rounded-sm border border-ink bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-stone">
                {t("home.browseDogs")}
              </Link>
              <Link href={`${localePath(lang, "/foods")}?species=cat`} className="rounded-sm border border-ink bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-stone">
                {t("home.browseCats")}
              </Link>
              <Link href={localePath(lang, "/foods/brand")} className="rounded-sm border border-ink bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-stone">
                {t("nav.allBrands")}
              </Link>
              <Link href={localePath(lang, "/my-pet")} className="inline-flex items-center gap-2 rounded-sm border border-ink bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-deep">
                <IconPaw className="h-4 w-4" /> {t("home.ctaPet")}
              </Link>
            </div>
          </div>

          {/* Right-hand Nutrition-Label Specification Dossier */}
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            <div className="rounded-sm border-2 border-ink bg-paper p-5 shadow-lift">
              <div className="flex items-start justify-between gap-3 border-b-[6px] border-ink pb-3">
                <div>
                  <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-widest text-ink-soft">
                    SCANABOWL · LAB INDEX
                  </p>
                  <p className="mt-0.5 font-display text-2xl font-semibold leading-none tracking-tight text-ink">
                    FEDIAF 2021 Dossier
                  </p>
                </div>
                <Image src="/logo.png" alt="" width={44} height={44} priority className="rounded-sm border border-ink" />
              </div>

              <dl className="divide-y divide-line border-b-4 border-ink font-mono text-sm tabular-nums">
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-xs uppercase tracking-wider text-ink-soft">{t("home.statFoods")}</dt>
                  <dd className="text-2xl font-semibold text-ink">{counts.products.toLocaleString(lang)}</dd>
                </div>
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-xs uppercase tracking-wider text-ink-soft">{t("home.statBrands")}</dt>
                  <dd className="text-2xl font-semibold text-ink">{counts.brands}</dd>
                </div>
                <div className="flex items-baseline justify-between py-2.5 text-xs">
                  <dt className="uppercase tracking-wider text-ink-soft">{t("score.pillars.nutrition")}</dt>
                  <dd className="font-semibold text-brand-deep">35 / 100 pts (DMB)</dd>
                </div>
                <div className="flex items-baseline justify-between py-2.5 text-xs">
                  <dt className="uppercase tracking-wider text-ink-soft">{t("score.pillars.ingredients")}</dt>
                  <dd className="font-semibold text-brand-deep">50 / 100 pts (EU 767/2009)</dd>
                </div>
                <div className="flex items-baseline justify-between py-2.5 text-xs">
                  <dt className="uppercase tracking-wider text-ink-soft">{t("score.pillars.formulation")}</dt>
                  <dd className="font-semibold text-brand-deep">15 / 100 pts</dd>
                </div>
              </dl>

              <div className="mt-3 flex items-center justify-between font-mono text-[0.7rem] text-ink-soft">
                <span>100% {t("home.engineerBadge")}</span>
                <Link href={localePath(lang, "/how-we-score")} className="font-semibold text-brand underline underline-offset-2 hover:text-brand-deep">
                  {t("home.howScore")} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works + Scientific Methodology Specification Grid */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="how-h">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
          <h2 id="how-h" className="font-display text-3xl font-semibold tracking-tight text-ink">{t("home.howTitle")}</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">01 — 03 PROTOCOL</span>
        </div>

        <ol className="mt-6 grid divide-y divide-line rounded-sm border-2 border-ink bg-paper md:grid-cols-3 md:divide-x md:divide-y-0">
          {steps.map((s, i) => (
            <li key={i} className="p-6">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">{t("home.step", { n: i + 1 })}</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-ink bg-stone text-ink">{s.icon}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>

        {/* Scientific methodology & Product & Quality Engineer profile */}
        <div className="mt-10 rounded-sm border-2 border-ink bg-paper">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-ink bg-stone px-6 py-4">
            <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">{t("home.scienceTitle")}</h3>
            <Link href={localePath(lang, "/how-we-score")} className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-brand hover:underline">
              {t("home.howScore")} <IconArrow className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {sciencePoints.map((pt, i) => (
              <li key={i} className="p-6">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-grade-a">SPEC 0{i + 1}</p>
                <p className="mt-1 font-display text-lg font-semibold text-ink">{pt.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{pt.text}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 border-t border-ink bg-brand-soft/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-ink">
              <span className="mr-2.5 inline-block rounded-sm border border-ink bg-brand px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-white">
                {t("home.engineerBadge")}
              </span>
              {t("home.engineerText")}
            </p>
            <Link href={localePath(lang, "/about")} className="shrink-0 font-mono text-xs font-semibold uppercase tracking-wider text-brand underline underline-offset-2 hover:text-brand-deep">
              {t("nav.about")} →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Top Scored Products */}
      <section className="border-y-2 border-ink bg-paper" aria-labelledby="top-h">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
            <div>
              <h2 id="top-h" className="font-display text-3xl font-semibold tracking-tight text-ink">{t("home.topTitle")}</h2>
              <p className="mt-1.5 max-w-2xl text-ink-soft">{t("home.topText")}</p>
            </div>
            <Link href={localePath(lang, "/how-we-score")} className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-brand hover:underline">
              {t("home.howScore")} <IconArrow className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
            {([["dog", dogs], ["cat", cats]] as const).map(([sp, list]) => (
              <div key={sp}>
                <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                  <h3 className="font-display text-xl font-semibold text-ink">{t(sp === "dog" ? "home.topDogs" : "home.topCats")}</h3>
                  <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">GRADE A</span>
                </div>
                <ul className="space-y-3">
                  {list.map((p) => (
                    <li key={p.id}><ProductCard entry={detailToIndex(p)} species={sp} lang={lang} t={t} /></li>
                  ))}
                </ul>
                <Link href={`${localePath(lang, "/foods")}?species=${sp}`} className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-brand hover:underline">
                  {t(sp === "dog" ? "home.allDogs" : "home.allCats")} <IconArrow className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best food for ... Guides */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6" aria-labelledby="guides-h">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
          <div>
            <h2 id="guides-h" className="font-display text-3xl font-semibold tracking-tight text-ink">{t("home.guidesTitle")}</h2>
            <p className="mt-1.5 max-w-2xl text-ink-soft">{t("home.guidesText")}</p>
          </div>
          <Link href={localePath(lang, "/best")} className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-brand hover:underline">
            {t("home.guidesAll")} <IconArrow className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
          {(["cat", "dog"] as const).map((sp) => (
            <div key={sp} className="rounded-sm border border-ink bg-paper p-5">
              <h3 className="mb-3 border-b border-line pb-2 font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">
                {t(sp === "cat" ? "guides.forCats" : "guides.forDogs")}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {GUIDES.filter((g) => g.species === sp).map((g) => (
                  <li key={g.slug}>
                    <Link href={localePath(lang, `/best/${g.slug}`)} className="inline-block rounded-sm border border-line bg-cream px-3 py-1.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-brand-soft hover:text-brand-deep">
                      {GUIDE_TEXT[lang][g.slug]?.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Personalise */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="pers-h">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 rounded-sm border-2 border-ink bg-brand-deep p-8 text-white shadow-lift sm:p-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-soft">NRC 2006 / FEDIAF RER MODEL</p>
            <h2 id="pers-h" className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("home.persTitle")}</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{t("home.persText")}</p>
            <Link href={localePath(lang, "/my-pet")} className="mt-6 inline-flex items-center gap-2 rounded-sm border border-ink bg-paper px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-brand-soft">
              <IconPaw className="h-4 w-4 text-brand" /> {t("home.persButton")}
            </Link>
          </div>
          <ul className="divide-y divide-white/15 border border-white/20 bg-brand/40 p-5 text-sm text-white/95">
            {(["home.persA", "home.persB", "home.persC", "home.persD"] as const).map((k) => (
              <li key={k} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                <span aria-hidden className="font-mono font-bold text-brand-soft">✓</span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="blog-h">
          <div className="flex items-end justify-between gap-3 border-b-2 border-ink pb-3">
            <h2 id="blog-h" className="font-display text-3xl font-semibold tracking-tight text-ink">{t("home.blogTitle")}</h2>
            <Link href={localePath(lang, "/blog")} className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-brand hover:underline">
              {t("home.allPosts")} <IconArrow className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <li key={p.slug}><BlogCard post={p} lang={lang} t={t} /></li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      <section className="border-t-2 border-ink bg-paper" aria-labelledby="faq-h">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 id="faq-h" className="font-display text-3xl font-semibold tracking-tight text-ink">{t("home.faqTitle")}</h2>
          <div className="mt-6 divide-y divide-line rounded-sm border-2 border-ink bg-cream">
            {faq.map((f, i) => (
              <details key={i} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-ink">
                  <span>{f.q}</span>
                  <span aria-hidden className="font-mono text-xl text-brand transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-soft"><Rich text={f.a.replaceAll("{lang}", lang)} /></p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Popular foods & brands directory for SEO and quick discovery */}
      <section className="border-t-2 border-ink bg-stone/70" aria-labelledby="popular-h">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
            <div>
              <h2 id="popular-h" className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{t("home.popularTitle")}</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-soft sm:text-base">{t("home.popularSubtitle")}</p>
            </div>
            <Link href={localePath(lang, "/foods/brand")} className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-brand hover:underline">
              {t("nav.allBrands")} ({counts.brands}) <IconArrow className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">{t("home.popularFoodsHeading")}</h3>
              <ul className="flex flex-wrap gap-2">
                {POPULAR_FOODS.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={localePath(lang, `/foods/${item.slug}`)}
                      prefetch={false}
                      className="inline-flex items-center gap-2 rounded-sm border border-ink bg-paper px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-brand-soft hover:text-brand-deep"
                    >
                      <span>{item.label}</span>
                      <span className="rounded-sm border border-brand/30 bg-brand-soft px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-brand-deep">
                        {item.score}/100
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">{t("home.popularBrandsHeading")}</h3>
              <ul className="flex flex-wrap gap-2">
                {popBrands.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={localePath(lang, `/foods/brand/${b.slug}`)}
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-brand-soft hover:text-brand-deep"
                    >
                      <span>{b.name}</span>
                      {b.avg !== null && (
                        <span className="font-mono text-xs tabular-nums text-ink-faint">({b.avg})</span>
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
        <div className="flex flex-col items-start justify-between gap-4 rounded-sm border-2 border-ink bg-paper p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{t("home.brandTitle")}</h2>
            <p className="mt-1 max-w-2xl text-ink-soft">{t("home.brandText")}</p>
          </div>
          <Link href={localePath(lang, "/brands")} className="shrink-0 rounded-sm border-2 border-ink bg-stone px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-brand hover:text-white">
            {t("home.brandButton")}
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <span className="hidden">{SITE.name}</span>
    </>
  );
}
