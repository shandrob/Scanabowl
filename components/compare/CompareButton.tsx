"use client";

import Link from "next/link";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { IconCheck } from "@/components/ui/Icons";
import { MAX_COMPARE, useCompare } from "@/lib/compare/store";
import { localePath } from "@/lib/i18n/config";
import type { Species } from "@/lib/scoring/types";

/**
 * "Add to comparison" on a food page. A button, not a link: search engines must not crawl a
 * compare-URL for every food.
 */
export function CompareButton({ id, species }: { id: string; species: Species }) {
  const t = useT();
  const lang = useLang();
  const { lists, toggle } = useCompare();
  const list = lists[species];
  const added = list.includes(id);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={() => toggle(species, id)}
        aria-pressed={added}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
          added ? "border-brand bg-brand-tint text-brand-deep" : "border-line bg-paper text-ink hover:border-brand-mid"
        }`}
      >
        {added ? <IconCheck className="h-4 w-4" /> : <span aria-hidden>+</span>}
        {added ? t("compare.added") : t("compare.addThis")}
      </button>
      {list.length > 0 && (
        <Link href={`${localePath(lang, "/compare")}?species=${species}&f=${list.map(encodeURIComponent).join(",")}`} prefetch={false} className="text-sm font-semibold text-brand underline underline-offset-2">
          {t("compare.open", { count: list.length, max: MAX_COMPARE })}
        </Link>
      )}
    </div>
  );
}
