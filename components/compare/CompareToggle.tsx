"use client";

import { useT } from "@/components/i18n/DictionaryProvider";
import { IconCheck } from "@/components/ui/Icons";
import { useCompare } from "@/lib/compare/store";
import type { Species } from "@/lib/scoring/types";

/** Small "compare" switch on a food card; sits over the card's photo corner (a button can't live inside the card link). */
export function CompareToggle({ id, species, name }: { id: string; species: Species; name: string }) {
  const t = useT();
  const { lists, toggle } = useCompare();
  const on = lists[species].includes(id);
  return (
    <button
      type="button"
      onClick={() => toggle(species, id)}
      aria-pressed={on}
      aria-label={on ? t("compare.removeCard", { name }) : t("compare.addCard", { name })}
      title={on ? t("compare.added") : t("compare.addThis")}
      className={`absolute left-2.5 top-2.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border font-sans text-sm font-semibold shadow-sm transition ${
        on ? "border-brand bg-brand text-white" : "border-line bg-paper/95 text-ink-soft hover:border-brand hover:text-brand"
      }`}
    >
      {on ? <IconCheck className="h-3.5 w-3.5" /> : <span aria-hidden>+</span>}
    </button>
  );
}
