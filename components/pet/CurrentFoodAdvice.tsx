"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/foods/ProductCard";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { loadIndex } from "@/lib/data/client";
import type { IndexEntry } from "@/lib/data/types";
import { localePath } from "@/lib/i18n/config";
import { usePets } from "@/lib/pets/store";
import { personalFit } from "@/lib/scoring/personalize";
import type { PetProfile, Species } from "@/lib/scoring/types";

/** Better choices than the food the pet eats now: same kind of food (or the preferred kind), safe for this pet. */
export function betterThanCurrent(index: IndexEntry[], pet: PetProfile, current: IndexEntry, count = 3): Array<{ e: IndexEntry; score: number }> {
  const base = personalFit(current, pet).score ?? current.sc ?? 0;
  const type = pet.preferredType ?? current.t;
  const rows: Array<{ e: IndexEntry; score: number }> = [];
  for (const e of index) {
    if (e.i === current.i || e.c !== "complete" || e.sc === null || e.cf === "low" || e.t !== type) continue;
    const fit = personalFit(e, pet);
    if (fit.allergy.excluded || fit.disliked.length || fit.score === null || fit.score < base + 4) continue;
    rows.push({ e, score: fit.score });
  }
  rows.sort((a, b) => b.score - a.score || a.e.n.localeCompare(b.e.n));
  // one food per brand, so the suggestions are a real choice
  const brands = new Set<string>();
  return rows.filter((r) => (brands.has(r.e.b) ? false : (brands.add(r.e.b), true))).slice(0, count);
}

export function CurrentFoodAdvice() {
  const t = useT();
  const lang = useLang();
  const { active } = usePets();
  const id = active?.currentFoodId;
  const species: Species | undefined = active?.species;
  const [loaded, setLoaded] = useState<{ species: Species; data: IndexEntry[] } | null>(null);
  useEffect(() => {
    if (!id || !species) return;
    let alive = true;
    loadIndex(species)
      .then((data) => alive && setLoaded({ species, data }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, species]);
  const index = loaded && loaded.species === species ? loaded.data : null;
  const current = useMemo(() => (index && id ? (index.find((e) => e.i === id) ?? null) : null), [index, id]);
  const better = useMemo(() => (index && active && current ? betterThanCurrent(index, active, current) : []), [index, active, current]);

  if (!active || !id || !current) return null;
  const fit = personalFit(current, active);
  const compare = better[0] ? `${localePath(lang, "/compare")}?species=${active.species}&f=${[current.i, ...better.slice(0, 2).map((b) => b.e.i)].map(encodeURIComponent).join(",")}` : null;

  return (
    <section aria-labelledby="current-h" className="mt-12">
      <h2 id="current-h" className="font-display text-2xl font-semibold text-brand-deep">{t("pet.currentTitle", { name: active.name })}</h2>
      <div className="mt-4 max-w-3xl">
        <ProductCard entry={current} species={active.species} lang={lang} t={t} personalScore={fit.score} petName={active.name} />
      </div>
      {fit.allergy.excluded && <p className="mt-3 max-w-3xl rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-ink">{t("personal.allergyBad", { name: active.name })}</p>}

      {current.sc === null ? (
        <p className="mt-4 text-ink-soft">{t("pet.currentNoScore")}</p>
      ) : better.length === 0 ? (
        <p className="mt-4 text-ink-soft">{t("pet.currentBest", { name: active.name })}</p>
      ) : (
        <>
          <h3 className="mt-8 font-display text-xl font-semibold text-ink">{t("pet.betterTitle", { name: active.name })}</h3>
          <p className="mt-1 text-sm text-ink-soft">{t("pet.betterText")}</p>
          <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
            {better.map(({ e, score }) => (
              <li key={e.i}>
                <ProductCard entry={e} species={active.species} lang={lang} t={t} personalScore={score} petName={active.name} />
              </li>
            ))}
          </ul>
          {compare && (
            <Link href={compare} prefetch={false} className="mt-5 inline-block rounded-xl bg-brand px-5 py-2.5 font-semibold text-white shadow-card transition hover:bg-brand-deep">
              {t("pet.compareCurrent")}
            </Link>
          )}
        </>
      )}
    </section>
  );
}
