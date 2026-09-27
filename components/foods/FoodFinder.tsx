"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { IconAlert, IconPaw } from "@/components/ui/Icons";
import { SearchBox } from "./SearchBox";
import { ProductCard } from "./ProductCard";
import { reportNoResults } from "@/lib/analytics";
import { loadIndex } from "@/lib/data/client";
import type { IndexEntry, Meta } from "@/lib/data/types";
import { localePath } from "@/lib/i18n/config";
import { foodTypeLabel, speciesLabel, stageLabel } from "@/lib/labels";
import { matchesQuery, queryTerms, searchHaystack } from "@/lib/search";
import { personalFit } from "@/lib/scoring/personalize";
import type { FoodType, LifeStage, Species } from "@/lib/scoring/types";
import { usePets } from "@/lib/pets/store";

const PAGE = 24;
type Sort = "match" | "score" | "name" | "kcal";
/** the most common food allergens in dogs and cats (Mueller et al., 2016) plus a few frequent choices */
const EXCLUDE_CHIPS = ["chicken", "beef", "fish", "dairy", "wheat", "lamb", "pork", "turkey", "egg"] as const;
/** slider value that means "no maximum" */
const NO_CARB_LIMIT = 70;

function useSearchText() {
  // normalised "brand name" per entry, computed once
  return useMemo(() => new Map<string, string>(), []);
}

export function FoodFinder({ brands }: { brands: Meta["brands"] }) {
  const t = useT();
  const lang = useLang();
  const params = useSearchParams();
  const { active } = usePets();
  const searchText = useSearchText();

  const [speciesChoice, setSpeciesChoice] = useState<Species>((params.get("species") as Species) === "cat" ? "cat" : "dog");
  const [speciesTouched, setSpeciesTouched] = useState(params.has("species"));
  // until the visitor picks a species themselves, follow the species of their pet
  const species: Species = !speciesTouched && active ? active.species : speciesChoice;
  const setSpecies = (sp: Species) => {
    setSpeciesChoice(sp);
    setSpeciesTouched(true);
  };
  const [q, setQ] = useState(params.get("q") ?? "");
  const [type, setType] = useState<FoodType | "all">((params.get("type") as FoodType) || "all");
  const [stage, setStage] = useState<LifeStage | "all">((params.get("stage") as LifeStage) || "all");
  const [brand, setBrand] = useState(params.get("brand") ?? "");
  const [grainFree, setGrainFree] = useState(params.get("gf") === "1");
  const [minScore, setMinScore] = useState(Number(params.get("min") ?? 0));
  const [sort, setSort] = useState<Sort>((params.get("sort") as Sort) || "score");
  // label filters that work without a pet profile
  const [exclude, setExclude] = useState<string[]>(() => (params.get("ex") ?? "").split(",").filter((a) => (EXCLUDE_CHIPS as readonly string[]).includes(a)));
  const [single, setSingle] = useState(params.get("sp") === "1");
  const [minProtein, setMinProtein] = useState(Number(params.get("minp") ?? 0));
  const [maxCarbs, setMaxCarbs] = useState(Number(params.get("maxc") ?? NO_CARB_LIMIT) || NO_CARB_LIMIT);
  const [extra, setExtra] = useState(false);
  const [ignorePet, setIgnorePet] = useState(false);
  const [loaded, setLoaded] = useState<{ species: Species; data: IndexEntry[] } | null>(null);
  const [failed, setFailed] = useState<Species | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const index = loaded?.species === species ? loaded.data : null;
  const error = failed === species;

  useEffect(() => {
    let alive = true;
    loadIndex(species)
      .then((data) => alive && setLoaded({ species, data }))
      .catch(() => alive && setFailed(species));
    return () => {
      alive = false;
    };
  }, [species]);

  // "show more" resets by itself whenever a filter changes
  const signature = [species, q, type, stage, brand, grainFree, minScore, sort, extra, ignorePet, exclude.join(","), single, minProtein, maxCarbs].join("|");
  const [more, setMore] = useState({ signature, shown: PAGE });
  const shown = more.signature === signature ? more.shown : PAGE;

  // keep the URL shareable
  useEffect(() => {
    const p = new URLSearchParams();
    if (speciesTouched || species === "cat") p.set("species", species);
    if (q) p.set("q", q);
    if (type !== "all") p.set("type", type);
    if (stage !== "all") p.set("stage", stage);
    if (brand) p.set("brand", brand);
    if (grainFree) p.set("gf", "1");
    if (minScore) p.set("min", String(minScore));
    if (sort !== "score") p.set("sort", sort);
    if (exclude.length) p.set("ex", exclude.join(","));
    if (single) p.set("sp", "1");
    if (minProtein) p.set("minp", String(minProtein));
    if (maxCarbs < NO_CARB_LIMIT) p.set("maxc", String(maxCarbs));
    const qs = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [species, speciesTouched, q, type, stage, brand, grainFree, minScore, sort, exclude, single, minProtein, maxCarbs]);

  const pet = active && active.species === species && !ignorePet ? active : null;

  const view = useMemo(() => {
    if (!index) return null;
    const terms = queryTerms(q);
    let hiddenByAllergy = 0;
    const rows: Array<{ e: IndexEntry; personal: number | null }> = [];
    for (const e of index) {
      if (!extra && (e.c !== "complete" || e.sc === null)) continue;
      if (type !== "all" && e.t !== type) continue;
      if (stage !== "all" && e.l !== stage && !(stage === "adult" && e.l === "all")) continue;
      if (brand && e.b !== brand) continue;
      if (grainFree && e.gf !== 1) continue;
      if (minScore && (e.sc ?? 0) < minScore) continue;
      // "without chicken" also hides vague "meat and animal derivatives" that may contain chicken
      if (exclude.length && exclude.some((a) => e.ad.includes(a) || e.ap.includes(a))) continue;
      if (single && !(e.pr.length === 1 && e.ap.length === 0)) continue;
      if (minProtein && (e.nu?.[0] ?? 0) < minProtein) continue;
      if (maxCarbs < NO_CARB_LIMIT && (e.cb === undefined || e.cb > maxCarbs)) continue;
      if (terms.length) {
        let hay = searchText.get(e.i);
        if (hay === undefined) {
          hay = searchHaystack(e.b, e.n, e.e);
          searchText.set(e.i, hay);
        }
        if (!matchesQuery(hay, terms)) continue;
      }
      let personal: number | null = null;
      if (pet) {
        const fit = personalFit(e, pet);
        if (fit.allergy.excluded) {
          hiddenByAllergy++;
          continue;
        }
        personal = fit.score;
      }
      rows.push({ e, personal });
    }
    const key = sort === "match" && !pet ? "score" : sort;
    rows.sort((a, b) => {
      if (key === "name") return a.e.n.localeCompare(b.e.n);
      if (key === "kcal") return (a.e.k ?? 9999) - (b.e.k ?? 9999);
      if (key === "match") return (b.personal ?? -1) - (a.personal ?? -1) || (b.e.sc ?? -1) - (a.e.sc ?? -1);
      return (b.e.sc ?? -1) - (a.e.sc ?? -1) || a.e.n.localeCompare(b.e.n);
    });
    return { rows, hiddenByAllergy };
  }, [index, q, type, stage, brand, grainFree, minScore, sort, extra, pet, searchText, exclude, single, minProtein, maxCarbs]);

  // Does the search find anything at all, ignoring the filters? If not, look at the other species (people often
  // search a cat food while the dog tab is open) and, if that finds nothing either, report the missing food.
  const totalMatches = useMemo(() => {
    const terms = queryTerms(q);
    if (!index || !terms.length) return null;
    let n = 0;
    for (const e of index) if (matchesQuery(searchHaystack(e.b, e.n, e.e), terms)) n++;
    return n;
  }, [index, q]);
  const [other, setOther] = useState<{ q: string; species: Species; count: number } | null>(null);
  useEffect(() => {
    if (totalMatches !== 0) return;
    const otherSpecies: Species = species === "dog" ? "cat" : "dog";
    let alive = true;
    const timer = setTimeout(() => {
      loadIndex(otherSpecies)
        .then((data) => {
          if (!alive) return;
          const terms = queryTerms(q);
          const count = data.filter((e) => matchesQuery(searchHaystack(e.b, e.n, e.e), terms)).length;
          setOther({ q, species: otherSpecies, count });
          // barcodes are reported by the barcode lookup itself
          if (count === 0 && !/^\d{8,14}$/.test(q.replace(/[\s-]/g, ""))) reportNoResults(lang, q);
        })
        .catch(() => {});
    }, 1500);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [totalMatches, q, species, lang]);
  const otherHit = totalMatches === 0 && other && other.q === q && other.species !== species && other.count > 0 ? other : null;

  const brandList = brands[species];
  const allergenNames = pet ? [...pet.allergens.map((a) => t(`allergen.${a}`)), ...pet.customAllergens] : [];
  const effectiveSort: Sort = sort === "match" && !pet ? "score" : sort;

  const field = "h-11 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink focus:border-brand-mid focus:outline-none focus:ring-4 focus:ring-brand-soft";
  const label = "mb-1.5 block font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint";

  const filters = (
    <div className="space-y-4">
      <div>
        <label htmlFor="f-type" className={label}>{t("finder.type")}</label>
        <select id="f-type" className={field} value={type} onChange={(e) => setType(e.target.value as FoodType | "all")}>
          <option value="all">{t("common.all")}</option>
          {(["dry", "wet", "frozen"] as const).map((v) => (
            <option key={v} value={v}>{foodTypeLabel(t, v)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-stage" className={label}>{t("finder.stage")}</label>
        <select id="f-stage" className={field} value={stage} onChange={(e) => setStage(e.target.value as LifeStage | "all")}>
          <option value="all">{t("common.all")}</option>
          {(["young", "adult", "senior"] as const).map((v) => (
            <option key={v} value={v}>{stageLabel(t, v, species)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-brand" className={label}>{t("finder.brand")}</label>
        <select id="f-brand" className={field} value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">{t("common.all")}</option>
          {brandList.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-min" className={label}>{t("finder.minScore", { score: minScore })}</label>
        <input id="f-min" type="range" min={0} max={90} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full accent-brand" />
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
        <input type="checkbox" checked={grainFree} onChange={(e) => setGrainFree(e.target.checked)} className="h-5 w-5 rounded accent-brand" />
        {t("finder.grainFree")}
      </label>
      <fieldset>
        <legend className={label}>{t("finder.without")}</legend>
        <div className="flex flex-wrap gap-1.5">
          {EXCLUDE_CHIPS.map((a) => {
            const on = exclude.includes(a);
            return (
              <button
                key={a}
                type="button"
                aria-pressed={on}
                onClick={() => setExclude((cur) => (on ? cur.filter((x) => x !== a) : [...cur, a]))}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${on ? "border-danger/40 bg-danger-soft text-danger line-through" : "border-line bg-paper text-ink-soft hover:border-brand-mid"}`}
              >
                {t(`allergen.${a}`)}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[0.7rem] leading-snug text-ink-faint">{t("finder.withoutHint")}</p>
      </fieldset>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
        <input type="checkbox" checked={single} onChange={(e) => setSingle(e.target.checked)} className="mt-0.5 h-5 w-5 rounded accent-brand" />
        <span>{t("finder.singleProtein")}</span>
      </label>
      <div>
        <label htmlFor="f-minp" className={label}>{t("finder.minProtein", { value: minProtein })}</label>
        <input id="f-minp" type="range" min={0} max={60} step={5} value={minProtein} onChange={(e) => setMinProtein(Number(e.target.value))} className="w-full accent-brand" />
      </div>
      <div>
        <label htmlFor="f-maxc" className={label}>{maxCarbs >= NO_CARB_LIMIT ? t("finder.maxCarbsAny") : t("finder.maxCarbs", { value: maxCarbs })}</label>
        <input id="f-maxc" type="range" min={10} max={NO_CARB_LIMIT} step={5} value={maxCarbs} onChange={(e) => setMaxCarbs(Number(e.target.value))} className="w-full accent-brand" />
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" checked={extra} onChange={(e) => setExtra(e.target.checked)} className="mt-0.5 h-5 w-5 rounded accent-brand" />
        <span>{t("finder.includeUnscored")}</span>
      </label>
      <button
        type="button"
        className="text-sm font-semibold text-brand underline underline-offset-2"
        onClick={() => {
          setType("all");
          setStage("all");
          setBrand("");
          setMinScore(0);
          setGrainFree(false);
          setExclude([]);
          setSingle(false);
          setMinProtein(0);
          setMaxCarbs(NO_CARB_LIMIT);
          setExtra(false);
          setQ("");
        }}
      >
        {t("common.reset")}
      </button>
    </div>
  );

  return (
    <div>
      {/* species + search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div role="tablist" aria-label={t("finder.species")} className="inline-flex shrink-0 rounded-2xl border border-line bg-paper p-1 shadow-sm">
          {(["dog", "cat"] as const).map((sp) => (
            <button
              key={sp}
              role="tab"
              aria-selected={species === sp}
              type="button"
              onClick={() => {
                setSpecies(sp);
                setBrand("");
              }}
              className={`rounded-xl px-6 py-2.5 text-base font-semibold transition ${species === sp ? "bg-brand text-white shadow" : "text-ink-soft hover:bg-brand-tint"}`}
            >
              {speciesLabel(t, sp, true)}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <SearchBox size="md" live={{ value: q, onChange: setQ }} />
        </div>
      </div>

      {/* dry and wet food are separate choices: people who feed kibble compare kibble */}
      <div role="group" aria-label={t("finder.type")} className="mt-4 flex flex-wrap gap-2">
        {(["all", "dry", "wet", "frozen"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={type === v}
            onClick={() => setType(v)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              type === v ? "border-brand bg-brand text-white" : "border-line bg-paper text-ink-soft hover:border-brand-mid hover:text-brand-deep"
            }`}
          >
            {v === "all" ? t("finder.allTypes") : foodTypeLabel(t, v)}
          </button>
        ))}
      </div>

      {/* pet banner */}
      {active && active.species === species && (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-brand/20 bg-brand-tint px-4 py-3 text-sm">
          <IconPaw className="h-5 w-5 text-brand" />
          {ignorePet ? (
            <span className="text-ink-soft">{t("finder.petIgnored", { name: active.name })}</span>
          ) : (
            <span className="text-ink">
              {t("finder.petBanner", { name: active.name })}
              {view && view.hiddenByAllergy > 0 && (
                <>
                  {" "}
                  <strong>{t("finder.hiddenAllergy", { count: view.hiddenByAllergy.toLocaleString(lang), allergens: allergenNames.join(", ") })}</strong>
                </>
              )}
            </span>
          )}
          <span className="ml-auto flex gap-4">
            <Link href={localePath(lang, "/my-pet")} className="font-semibold text-brand underline underline-offset-2">{t("finder.editProfile")}</Link>
            <button type="button" className="font-semibold text-brand underline underline-offset-2" onClick={() => setIgnorePet((v) => !v)}>
              {ignorePet ? t("finder.usePet", { name: active.name }) : t("finder.ignorePet")}
            </button>
          </span>
        </div>
      )}
      {!active && (
        <div className="mt-5 rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink-soft">
          <IconPaw className="mr-2 inline h-4 w-4 text-brand-mid" />
          {t("finder.noPet")}{" "}
          <Link href={localePath(lang, "/my-pet")} className="font-semibold text-brand underline underline-offset-2">{t("finder.createProfile")}</Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* filters */}
        <aside>
          <button
            type="button"
            className="mb-3 flex w-full items-center justify-between rounded-xl border border-line bg-paper px-4 py-3 font-semibold lg:hidden"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {t("finder.filters")}
            <span aria-hidden>{filtersOpen ? "−" : "+"}</span>
          </button>
          <div className={`${filtersOpen ? "block" : "hidden"} rounded-2xl border border-line bg-paper p-5 shadow-card lg:sticky lg:top-24 lg:block`}>{filters}</div>
        </aside>

        {/* results */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft" role="status" aria-live="polite">
              {view ? t("finder.count", { count: view.rows.length.toLocaleString(lang) }) : t("common.loading")}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="f-sort" className="text-sm text-ink-soft">{t("finder.sort")}</label>
              <select id="f-sort" value={effectiveSort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 rounded-xl border border-line bg-paper px-3 text-sm">
                {pet && <option value="match">{t("finder.sortMatch", { name: pet.name })}</option>}
                <option value="score">{t("finder.sortScore")}</option>
                <option value="name">{t("finder.sortName")}</option>
                <option value="kcal">{t("finder.sortKcal")}</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-danger" role="alert">
              <IconAlert /> {t("finder.error")}
            </div>
          )}
          {!view && !error && (
            <ul className="grid gap-4 sm:grid-cols-2" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="h-32 animate-pulse rounded-2xl bg-line/60" />
              ))}
            </ul>
          )}
          {view && view.rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-paper p-8 text-center">
              <p className="font-display text-xl font-semibold text-brand-deep">{t("finder.emptyTitle")}</p>
              {totalMatches !== null && totalMatches > 0 ? (
                <p className="mt-2 text-ink-soft">
                  {t("finder.hiddenByFilters", { count: totalMatches })}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setType("all");
                      setStage("all");
                      setBrand("");
                      setMinScore(0);
                      setGrainFree(false);
                      setExclude([]);
                      setSingle(false);
                      setMinProtein(0);
                      setMaxCarbs(NO_CARB_LIMIT);
                      setExtra(true);
                    }}
                    className="font-semibold text-brand underline underline-offset-2"
                  >
                    {t("finder.showHidden")}
                  </button>
                </p>
              ) : otherHit ? (
                <p className="mt-2 text-ink-soft">
                  {t(otherHit.species === "cat" ? "finder.otherSpeciesCat" : "finder.otherSpeciesDog", { count: otherHit.count })}{" "}
                  <button type="button" onClick={() => setSpecies(otherHit.species)} className="font-semibold text-brand underline underline-offset-2">
                    {t(otherHit.species === "cat" ? "finder.switchToCat" : "finder.switchToDog")}
                  </button>
                </p>
              ) : (
                <p className="mt-2 text-ink-soft">{t("finder.emptyText")}</p>
              )}
              <Link href={localePath(lang, "/suggest")} className="mt-4 inline-block font-semibold text-brand underline underline-offset-2">
                {t("finder.suggestMissing")}
              </Link>
            </div>
          )}
          {view && view.rows.length > 0 && (
            <>
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 2xl:grid-cols-2">
                {view.rows.slice(0, shown).map(({ e, personal }) => (
                  <li key={e.i} className="relative">
                    <ProductCard entry={e} species={species} lang={lang} t={t} personalScore={personal} petName={pet?.name} />
                    <CompareToggle id={e.i} species={species} name={e.n} />
                  </li>
                ))}
              </ul>
              {shown < view.rows.length && (
                <div className="mt-8 text-center">
                  <button type="button" onClick={() => setMore({ signature, shown: shown + PAGE })} className="rounded-2xl border border-brand bg-paper px-8 py-3 font-semibold text-brand hover:bg-brand-tint">
                    {t("common.showMore", { count: Math.min(PAGE, view.rows.length - shown) })}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
