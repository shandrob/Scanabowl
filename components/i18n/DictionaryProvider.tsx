"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import { createRaw, createT, type Messages, type TFunction } from "@/lib/i18n/t";

interface Ctx {
  lang: Locale;
  t: TFunction;
  raw: ReturnType<typeof createRaw>;
}

const I18nContext = createContext<Ctx | null>(null);

export function DictionaryProvider({ lang, dict, children }: { lang: Locale; dict: Messages; children: React.ReactNode }) {
  const value = useMemo<Ctx>(() => ({ lang, t: createT(dict), raw: createRaw(dict) }), [lang, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("DictionaryProvider is missing");
  return ctx;
}

export const useT = () => useI18n().t;
export const useLang = () => useI18n().lang;
export const useRaw = () => useI18n().raw;
