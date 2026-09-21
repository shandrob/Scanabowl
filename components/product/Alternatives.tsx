"use client";

import { useMemo } from "react";
import { ProductCard } from "@/components/foods/ProductCard";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import type { IndexEntry } from "@/lib/data/types";
import { usePets } from "@/lib/pets/store";
import { personalFit } from "@/lib/scoring/personalize";
import type { Species } from "@/lib/scoring/types";

/** Higher-scoring foods of the same kind - filtered again for the visitor's pet (allergies). */
export function Alternatives({ candidates, species }: { candidates: IndexEntry[]; species: Species }) {
  const t = useT();
  const lang = useLang();
  const { active } = usePets();
  const pet = active && active.species === species ? active : null;

  const list = useMemo(() => {
    const rows = candidates
      .map((e) => ({ e, fit: pet ? personalFit(e, pet) : null }))
      .filter((r) => !r.fit?.allergy.excluded);
    if (pet) rows.sort((a, b) => (b.fit?.score ?? 0) - (a.fit?.score ?? 0));
    return rows.slice(0, 4);
  }, [candidates, pet]);

  if (list.length === 0) return null;
  return (
    <section aria-labelledby="alt-h">
      <h2 id="alt-h" className="font-display text-2xl font-semibold text-brand-deep">{t("product.alternativesTitle")}</h2>
      <p className="mt-1 text-ink-soft">{pet ? t("product.alternativesPet", { name: pet.name }) : t("product.alternativesText")}</p>
      <ul className="mt-5 grid gap-4 md:grid-cols-2">
        {list.map(({ e, fit }) => (
          <li key={e.i}>
            <ProductCard entry={e} species={species} lang={lang} t={t} personalScore={fit?.score} petName={pet?.name} />
          </li>
        ))}
      </ul>
    </section>
  );
}
