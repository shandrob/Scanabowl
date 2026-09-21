import type { Metadata } from "next";
import { alternateLanguages, localePath, type Locale } from "./i18n/config";

/** Consistent title / description / canonical / hreflang for a page. */
export function pageMeta(lang: Locale, path: string, title: string, description: string, extra: Partial<Metadata> = {}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: localePath(lang, path), languages: alternateLanguages(path) },
    openGraph: { title, description, url: localePath(lang, path) },
    ...extra,
  };
}
