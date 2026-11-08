"use client";

import Link from "next/link";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { localePath } from "@/lib/i18n/config";

export default function NotFound() {
  const t = useT();
  const lang = useLang();
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <div className="rounded-sm border-2 border-ink bg-paper p-8 shadow-lift">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-brand">ERROR 404 · SPECIMEN NOT FOUND</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">{t("errors.notFoundTitle")}</h1>
        <p className="mt-4 text-lg text-ink-soft">{t("errors.notFoundText")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={localePath(lang)} className="rounded-sm border border-ink bg-brand px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-deep">{t("errors.home")}</Link>
          <Link href={localePath(lang, "/foods")} className="rounded-sm border border-ink bg-stone px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:bg-brand-soft">{t("nav.foods")}</Link>
        </div>
      </div>
    </div>
  );
}
