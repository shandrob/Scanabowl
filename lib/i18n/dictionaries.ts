import "server-only";
import type { Locale } from "./config";
import { fillLinkLanguage, type Messages } from "./t";

const loaders: Record<Locale, () => Promise<Messages>> = {
  nl: () => import("../../messages/nl.json").then((m) => m.default as unknown as Messages),
  en: () => import("../../messages/en.json").then((m) => m.default as unknown as Messages),
  de: () => import("../../messages/de.json").then((m) => m.default as unknown as Messages),
  fr: () => import("../../messages/fr.json").then((m) => m.default as unknown as Messages),
};

const cache = new Map<Locale, Promise<Messages>>();

export async function getDictionary(lang: Locale): Promise<Messages> {
  let d = cache.get(lang);
  if (!d) {
    d = loaders[lang]().then((m) => fillLinkLanguage(m, lang));
    cache.set(lang, d);
  }
  return d;
}
