import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Sections } from "@/components/ui/LongPage";
import { Rich } from "@/components/ui/Rich";
import { aboutStory } from "@/lib/about";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createRaw, createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";

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
  const story = aboutStory(lang);
  const sections = createRaw(dict)("about.sections");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: t("about.title"),
    url: `${SITE.url}${localePath(lang, "/about")}`,
    mainEntity: { "@type": "Organization", name: "Scanabowl", url: SITE.url, logo: `${SITE.url}/logo.png`, email: SITE.email },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
      <header className="border-b-2 border-ink pb-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">INDEPENDENT PET FOOD AUDIT</p>
        <h1 className="mt-1 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">{t("about.title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft"><Rich text={t("about.intro")} /></p>
      </header>

      {story && (
        <section aria-labelledby="story-h" className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 rounded-sm border-2 border-ink bg-paper p-6 sm:p-10 md:grid-cols-[240px_minmax(0,1fr)]">
          {story.photo ? (
            <Image src={story.photo} alt={story.photoAlt} width={480} height={600} unoptimized priority className="h-auto w-full max-w-[240px] rounded-sm border border-ink object-cover" />
          ) : (
            <div className="hidden md:block">
              <Image src="/logo.png" alt="" width={240} height={240} className="rounded-sm border border-ink" />
            </div>
          )}
          <div>
            <h2 id="story-h" className="border-b-4 border-ink pb-2 font-display text-3xl font-semibold tracking-tight text-ink">{story.title}</h2>
            <div className="prose-scan mt-5" dangerouslySetInnerHTML={{ __html: story.html }} />
          </div>
        </section>
      )}

      <div className="prose-scan mt-12">
        <Sections sections={sections} />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
