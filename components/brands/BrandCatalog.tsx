"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/foods/ProductCard";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { IconSearch } from "@/components/ui/Icons";
import type { IndexEntry } from "@/lib/data/types";
import { foodTypeLabel, speciesLabel, stageLabel } from "@/lib/labels";
import { packGrams } from "@/lib/pets/energy";
import { usePets } from "@/lib/pets/store";
import { personalFit } from "@/lib/scoring/personalize";
import type { FoodType, LifeStage, Species } from "@/lib/scoring/types";
import { matchesQuery, queryTerms, searchHaystack } from "@/lib/search";

type BrandSort = "score" | "value" | "price" | "name";

function pricePerKg(e: IndexEntry): number {
  if (!e.pc || e.pc <= 0) return 99999;
  const g = e.pk ? packGrams(e.pk) : null;
  if (!g || g <= 0) return 99999;
  return e.pc / (g / 1000);
}

function valueRatio(e: IndexEntry): number {
  if (e.sc === null || e.sc < 55) return -1;
  const ppk = pricePerKg(e);
  if (ppk >= 99999) return -1;
  return (e.sc * e.sc) / Math.max(ppk, 1.5);
}

export function BrandCatalog({
  brandName,
  dogItems,
  catItems,
  title,
  searchPlaceholder,
}: {
  brandName: string;
  dogItems: IndexEntry[];
  catItems: IndexEntry[];
  title?: string;
  searchPlaceholder?: string;
}) {
  const t = useT();
  const lang = useLang();
  const { active } = usePets();

  const hasBoth = dogItems.length > 0 && catItems.length > 0;
  const [speciesFilter, setSpeciesFilter] = useState<"all" | Species>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | FoodType>("all");
  const [stageFilter, setStageFilter] = useState<"all" | LifeStage>("all");
  const [grainFreeOnly, setGrainFreeOnly] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<BrandSort>("score");

  const allItems = useMemo(() => {
    const d = dogItems.map((entry) => ({ entry, species: "dog" as Species }));
    const c = catItems.map((entry) => ({ entry, species: "cat" as Species }));
    return [...d, ...c];
  }, [dogItems, catItems]);

  const availableTypes = useMemo(() => {
    const s = new Set<FoodType>();
    for (const item of allItems) {
      if (speciesFilter === "all" || item.species === speciesFilter) s.add(item.entry.t);
    }
    return [...s];
  }, [allItems, speciesFilter]);

  const hasGrainFree = useMemo(
    () => allItems.some((item) => item.entry.gf === 1),
    [allItems],
  );

  const filtered = useMemo(() => {
    const terms = queryTerms(q);
    const list = allItems.filter(({ entry, species }) => {
      if (speciesFilter !== "all" && species !== speciesFilter) return false;
      if (typeFilter !== "all" && entry.t !== typeFilter) return false;
      if (stageFilter !== "all" && entry.l !== stageFilter && entry.l !== "all") return false;
      if (grainFreeOnly && entry.gf !== 1) return false;
      if (terms.length && !matchesQuery(searchHaystack(entry.b, entry.n, entry.e), terms)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sort === "name") return a.entry.n.localeCompare(b.entry.n);
      if (sort === "price") return pricePerKg(a.entry) - pricePerKg(b.entry) || (b.entry.sc ?? -1) - (a.entry.sc ?? -1);
      if (sort === "value") return valueRatio(b.entry) - valueRatio(a.entry) || (b.entry.sc ?? -1) - (a.entry.sc ?? -1);
      return (b.entry.sc ?? -1) - (a.entry.sc ?? -1) || a.entry.n.localeCompare(b.entry.n);
    });
  }, [allItems, speciesFilter, typeFilter, stageFilter, grainFreeOnly, q, sort]);

  const activeFilters =
    speciesFilter !== "all" || typeFilter !== "all" || stageFilter !== "all" || grainFreeOnly || q.trim().length > 0;

  return (
    <section aria-labelledby="brand-all-h" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="brand-all-h" className="font-display text-3xl font-semibold tracking-tight text-brand-deep">
            {title ?? t("brandPages.allProductsTitle", { brand: brandName, count: allItems.length })}
          </h2>
          <p className="mt-1 font-sans text-sm text-ink-soft">
            {t("brandPages.allProductsSubtitle", { shown: filtered.length, total: allItems.length })}
          </p>
        </div>
        {activeFilters && (
          <button
            type="button"
            onClick={() => {
              setSpeciesFilter("all");
              setTypeFilter("all");
              setStageFilter("all");
              setGrainFreeOnly(false);
              setQ("");
            }}
            className="rounded-lg border border-line bg-paper px-3.5 py-2 font-sans text-xs font-semibold text-brand-deep transition hover:bg-brand-soft"
          >
            {t("common.reset")}
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-5 rounded-2xl border border-line bg-paper p-5 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder ?? t("brandPages.searchPlaceholder", { brand: brandName })}
              aria-label={searchPlaceholder ?? t("brandPages.searchPlaceholder", { brand: brandName })}
              className="h-11 w-full rounded-xl border border-[#D6D1C7] bg-cream/60 pl-10 pr-4 font-sans text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:bg-paper focus:outline-none focus:ring-2 focus:ring-brand-soft"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="brand-sort" className="font-sans text-xs font-medium text-ink-soft">
              {t("finder.sort")}:
            </label>
            <select
              id="brand-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as BrandSort)}
              className="h-11 rounded-xl border border-line bg-cream/60 px-3.5 font-sans text-sm font-medium text-ink focus:border-brand focus:outline-none"
            >
              <option value="score">{t("finder.sortScore")}</option>
              <option value="value">{t("finder.sortValue")}</option>
              <option value="price">{t("finder.sortPrice")}</option>
              <option value="name">{t("finder.sortName")}</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hasBoth && (
            <div className="flex flex-wrap gap-1.5 pr-2">
              {(["all", "dog", "cat"] as const).map((sp) => {
                const isActive = speciesFilter === sp;
                const count = sp === "all" ? allItems.length : sp === "dog" ? dogItems.length : catItems.length;
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpeciesFilter(sp)}
                    className={`rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition ${
                      isActive
                        ? "bg-brand text-white shadow-sm"
                        : "border border-[#E2DDD5] bg-cream text-ink hover:border-brand-mid hover:bg-brand-soft"
                    }`}
                  >
                    {sp === "all" ? t("common.all") : speciesLabel(t, sp, true)} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {availableTypes.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pr-2">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition ${
                  typeFilter === "all"
                    ? "bg-brand-deep text-white shadow-sm"
                    : "border border-[#E2DDD5] bg-paper text-ink-soft hover:border-brand-mid hover:text-ink"
                }`}
              >
                {t("finder.allTypes")}
              </button>
              {availableTypes.map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setTypeFilter(tp === typeFilter ? "all" : tp)}
                  className={`rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition ${
                    typeFilter === tp
                      ? "bg-brand-deep text-white shadow-sm"
                      : "border border-[#E2DDD5] bg-paper text-ink-soft hover:border-brand-mid hover:text-ink"
                  }`}
                >
                  {foodTypeLabel(t, tp)}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {(["young", "adult", "senior"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStageFilter(stageFilter === st ? "all" : st)}
                className={`rounded-full px-3 py-1.5 font-sans text-xs font-medium transition ${
                  stageFilter === st
                    ? "bg-brand-soft font-semibold text-brand-deep ring-1 ring-brand"
                    : "border border-[#E2DDD5] bg-paper text-ink-soft hover:border-brand-mid hover:text-ink"
                }`}
              >
                {stageLabel(t, st, speciesFilter === "cat" ? "cat" : "dog")}
              </button>
            ))}
            {hasGrainFree && (
              <button
                type="button"
                onClick={() => setGrainFreeOnly((v) => !v)}
                className={`rounded-full px-3 py-1.5 font-sans text-xs font-medium transition ${
                  grainFreeOnly
                    ? "bg-brand-soft font-semibold text-brand-deep ring-1 ring-brand"
                    : "border border-[#E2DDD5] bg-paper text-ink-soft hover:border-brand-mid hover:text-ink"
                }`}
              >
                {t("common.grainFree")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* All Products Grid */}
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-paper p-8 text-center shadow-card">
          <p className="font-display text-xl font-semibold text-ink">{t("finder.emptyTitle")}</p>
          <p className="mt-1 font-sans text-sm text-ink-soft">{t("finder.emptyText")}</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map(({ entry, species }) => {
            const pet = active && active.species === species ? active : null;
            const fit = pet ? personalFit(entry, pet) : null;
            return (
              <li key={entry.i}>
                <ProductCard
                  entry={entry}
                  species={species}
                  lang={lang}
                  t={t}
                  personalScore={fit?.score}
                  petName={pet?.name}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
