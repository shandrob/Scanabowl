export const LOCALES = ["nl", "en", "de", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "nl";

export const LOCALE_NAMES: Record<Locale, string> = {
  nl: "Nederlands",
  en: "English",
  de: "Deutsch",
  fr: "Français",
};

/** BCP-47 tags for <html lang>, hreflang and Open Graph */
export const LOCALE_TAGS: Record<Locale, string> = {
  nl: "nl-NL",
  en: "en",
  de: "de-DE",
  fr: "fr-FR",
};

export const LOCALE_COOKIE = "scanabowl-lang";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** "/foods" + "nl" -> "/nl/foods". `path` must start with "/" or be empty. */
export function localePath(lang: Locale, path = ""): string {
  const p = path === "/" ? "" : path;
  return `/${lang}${p}`;
}

/** Path without its language prefix: "/nl/foods?x=1" -> "/foods". */
export function stripLocale(pathname: string): string {
  const m = pathname.match(/^\/(nl|en|de|fr)(\/.*)?$/);
  return m ? (m[2] ?? "") || "/" : pathname;
}

/** Map for Next.js `alternates.languages` (hreflang). */
export function alternateLanguages(path = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[LOCALE_TAGS[l]] = localePath(l, path);
  out["x-default"] = localePath(DEFAULT_LOCALE, path);
  return out;
}

/** Pick the best supported language from an Accept-Language header. */
export function negotiate(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number.parseFloat(q.trim().slice(2)) : 1 };
    })
    .filter((x) => x.tag && Number.isFinite(x.q))
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
