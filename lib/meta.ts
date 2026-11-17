import type { Metadata } from "next";
import { alternateLanguages, localePath, type Locale } from "./i18n/config";

/**
 * Clamp a meta description to `max` characters at a word boundary,
 * appending "…" only when the text was actually cut.
 */
export function clampDescription(text: string, max = 155): string {
  if (max <= 0) return "";
  if (text.length <= max) return text;
  const slice = text.slice(0, max + 1);
  const space = slice.lastIndexOf(" ");
  const raw = space > 0 ? slice.slice(0, space) : text.slice(0, max);
  const base = raw.replace(/[\s,;:\-–—]+$/, "") || text.slice(0, max).trimEnd();
  return base ? `${base}…` : "";
}

/** Consistent title / description / canonical / hreflang for a page. */
export function pageMeta(lang: Locale, path: string, title: string, description: string, extra: Partial<Metadata> = {}): Metadata {
  const clamped = clampDescription(description);
  return {
    title,
    description: clamped,
    alternates: { canonical: localePath(lang, path), languages: alternateLanguages(path) },
    openGraph: { title, description: clamped, url: localePath(lang, path) },
    ...extra,
  };
}
