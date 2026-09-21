import "server-only";
import type { Locale } from "./config";
import type { Messages } from "./t";

const loaders: Record<Locale, () => Promise<Messages>> = {
  nl: () => import("../../messages/nl.json").then((m) => m.default as unknown as Messages),
  en: () => import("../../messages/en.json").then((m) => m.default as unknown as Messages),
  de: () => import("../../messages/de.json").then((m) => m.default as unknown as Messages),
  fr: () => import("../../messages/fr.json").then((m) => m.default as unknown as Messages),
};

export async function getDictionary(lang: Locale): Promise<Messages> {
  return loaders[lang]();
}
