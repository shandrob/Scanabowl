import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { DictionaryProvider } from "@/components/i18n/DictionaryProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LOCALES, LOCALE_TAGS, alternateLanguages, isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { SITE } from "@/lib/site";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"], display: "swap" });
const grotesk = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = { themeColor: "#065f46", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return {
    metadataBase: new URL(SITE.url),
    title: { default: t("meta.title"), template: `%s | Scanabowl` },
    description: t("meta.description"),
    applicationName: "Scanabowl",
    alternates: { canonical: localePath(lang), languages: alternateLanguages() },
    openGraph: {
      type: "website",
      siteName: "Scanabowl",
      locale: LOCALE_TAGS[lang].replace("-", "_"),
      title: t("meta.title"),
      description: t("meta.description"),
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Scanabowl" }],
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = createT(dict);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Scanabowl",
        url: SITE.url,
        logo: `${SITE.url}/logo.png`,
        email: SITE.email,
      },
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
    ],
  };

  return (
    <html lang={LOCALE_TAGS[lang]} className={`${fraunces.variable} ${grotesk.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh">
        <DictionaryProvider lang={lang} dict={dict}>
          <a href="#main" className="skip-link">
            {t("nav.skip")}
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer lang={lang} t={t} />
        </DictionaryProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
