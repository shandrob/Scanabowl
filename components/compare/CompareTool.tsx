"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { GradeBadge, gradeOf } from "@/components/ui/grade";
import { IconExternal, IconPaw, IconSearch, IconX } from "@/components/ui/Icons";
import { ProductImage } from "@/components/ui/ProductImage";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { MAX_COMPARE, useCompare } from "@/lib/compare/store";
import { loadIndex } from "@/lib/data/client";
import type { IndexEntry } from "@/lib/data/types";
import { localePath } from "@/lib/i18n/config";
import { foodTypeLabel, gradeLabel, scoreAria, speciesLabel, stageLabel } from "@/lib/labels";
import { dailyEnergy, gramsPerDay, packGrams } from "@/lib/pets/energy";
import { usePets } from "@/lib/pets/store";
import { personalFit } from "@/lib/scoring/personalize";
import type { PetProfile, Species } from "@/lib/scoring/types";
import { matchesQuery, queryTerms, searchHaystack } from "@/lib/search";
import { zooplusAffiliateUrl } from "@/lib/zooplus";

const DEFAULT_WEIGHT: Record<Species, number> = { dog: 15, cat: 4 };

/** An average adult pet of the given weight, for visitors without a pet profile. */
function standardPet(species: Species, weightKg: number): PetProfile {
  return {
    id: "standard",
    name: "",
    species,
    ageYears: 4,
    weightKg,
    neutered: species === "cat",
    activity: "moderate",
    bodyCondition: "ideal",
    dogSize: weightKg < 10 ? "small" : weightKg < 25 ? "medium" : weightKg < 45 ? "large" : "giant",
    allergens: [],
    customAllergens: [],
    strictAllergies: true,
  };
}

function parseNumber(v: string): number | null {
  const n = Number.parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function CompareTool() {
  const t = useT();
  const lang = useLang();
  const params = useSearchParams();
  const { active } = usePets();
  const { lists, set } = useCompare();

  const urlIds = useMemo(() => (params.get("f") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_COMPARE), [params]);
  const urlSpecies = params.get("species");
  const [speciesChoice, setSpeciesChoice] = useState<Species | null>(urlSpecies === "cat" || urlSpecies === "dog" ? urlSpecies : null);
  const species: Species = speciesChoice ?? (lists.cat.length > lists.dog.length ? "cat" : lists.dog.length ? "dog" : (active?.species ?? "dog"));

  // The address (?f=...) is the list on this page, so a shared link shows exactly what was shared. Without one,
  // the list saved in this browser (filled by the "Compare" buttons on food pages) is shown.
  const ids = params.has("f") ? urlIds : lists[species];
  useEffect(() => {
    if (params.has("f")) set(species, urlIds);
  }, [params, urlIds, species, set]);
  const show = (sp: Species, next: string[]) => {
    const p = new URLSearchParams({ species: sp, f: next.join(",") });
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  };

  const [loaded, setLoaded] = useState<{ species: Species; data: IndexEntry[] } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadIndex(species)
      .then((data) => alive && setLoaded({ species, data }))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [species]);
  const index = loaded?.species === species ? loaded.data : null;
  const byId = useMemo(() => new Map((index ?? []).map((e) => [e.i, e])), [index]);
  const foods = ids.map((id) => byId.get(id)).filter((e): e is IndexEntry => !!e);

  // ------------------------------------------------------------ picker
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const terms = queryTerms(q);
    if (!index || !terms.length) return [];
    const out: IndexEntry[] = [];
    for (const e of index) {
      if (ids.includes(e.i)) continue;
      if (matchesQuery(searchHaystack(e.b, e.n, e.e), terms)) out.push(e);
      if (out.length >= 8) break;
    }
    return out;
  }, [index, q, ids]);

  // ------------------------------------------------------------ portions and cost
  const pet = active && active.species === species ? active : null;
  const [weight, setWeight] = useState<string>("");
  const weightKg = parseNumber(weight) ?? DEFAULT_WEIGHT[species];
  const energy = dailyEnergy(pet ?? standardPet(species, weightKg));
  const [prices, setPrices] = useState<Record<string, string>>({});

  const rows = foods.map((e) => {
    const grams = e.k ? gramsPerDay(energy.kcal, e.k) : null;
    const pack = packGrams(e.pk);
    const typed = parseNumber(prices[e.i] ?? "");
    const price = typed ?? e.pc ?? null;
    // a typed price is per pack when we know the pack size, otherwise per kilo
    const perGram = price === null ? null : pack ? price / pack : price / 1000;
    const perDay = perGram !== null && grams ? perGram * grams : null;
    const fit = pet ? personalFit(e, pet) : null;
    return { e, grams, pack, perDay, fit };
  });

  const best = (values: Array<number | null | undefined>, low = false) => {
    const known = values.filter((v): v is number => typeof v === "number");
    if (known.length < 2) return null;
    const target = low ? Math.min(...known) : Math.max(...known);
    return known.filter((v) => v === target).length === known.length ? null : target;
  };
  const money = (v: number) => v.toLocaleString(lang, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${v.toLocaleString(lang, { maximumFractionDigits: 1 })}%`);

  const update = (next: string[]) => {
    set(species, next);
    show(species, next);
  };
  const remove = (id: string) => update(ids.filter((x) => x !== id));
  const add = (id: string) => {
    update([...ids, id].slice(0, MAX_COMPARE));
    setQ("");
  };
  const switchSpecies = (sp: Species) => {
    setSpeciesChoice(sp);
    show(sp, lists[sp]);
  };

  const label = "font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-faint";
  const cols = Math.max(foods.length, 1);
  const grid = { gridTemplateColumns: `minmax(7.5rem, 0.8fr) repeat(${cols}, minmax(9rem, 1fr))` };

  type Row = { key: string; label: string; cells: React.ReactNode[] };
  // "best" only where more (or less) is clearly better: score parts, animal protein, cost. More protein or a bigger
  // portion is not better in itself.
  const numberRow = (key: string, text: string, values: Array<number | null | undefined>, format: (v: number) => string, mark: "high" | "low" | "none" = "high"): Row => {
    const b = mark === "none" ? null : best(values, mark === "low");
    return {
      key,
      label: text,
      cells: values.map((v, i) => (
        <span key={i} className={v !== null && v !== undefined && v === b ? "font-semibold text-grade-a" : undefined}>
          {v === null || v === undefined ? "–" : format(v)}
          {v !== null && v !== undefined && v === b && <span className="sr-only"> ({t("compare.best")})</span>}
        </span>
      )),
    };
  };

  const table: Row[] = foods.length
    ? [
        numberRow("n", `${t("score.pillars.nutrition")} (/35)`, rows.map((r) => r.e.pl?.[0]), (v) => v.toLocaleString(lang, { maximumFractionDigits: 1 })),
        numberRow("i", `${t("score.pillars.ingredients")} (/50)`, rows.map((r) => r.e.pl?.[1]), (v) => v.toLocaleString(lang, { maximumFractionDigits: 1 })),
        numberRow("f", `${t("score.pillars.formulation")} (/15)`, rows.map((r) => r.e.pl?.[2]), (v) => v.toLocaleString(lang, { maximumFractionDigits: 1 })),
        { key: "type", label: t("finder.type"), cells: rows.map((r) => foodTypeLabel(t, r.e.t)) },
        { key: "stage", label: t("finder.stage"), cells: rows.map((r) => stageLabel(t, r.e.l, species)) },
        numberRow("p", t("compare.protein"), rows.map((r) => r.e.nu?.[0]), (v) => pct(v), "none"),
        numberRow("an", t("compare.animal"), rows.map((r) => r.e.an), (v) => pct(v)),
        { key: "fat", label: t("compare.fat"), cells: rows.map((r) => pct(r.e.nu?.[1])) },
        { key: "kcal", label: t("compare.kcal"), cells: rows.map((r) => (r.e.k ? `${r.e.k} kcal` : "–")) },
        { key: "gf", label: t("common.grainFree"), cells: rows.map((r) => (r.e.gf ? t("common.yes") : t("common.no"))) },
        {
          key: "al",
          label: t("compare.contains"),
          cells: rows.map((r) => {
            const names = r.e.ad.map((a) => (t(`allergen.${a}`).startsWith("allergen.") ? a : t(`allergen.${a}`)));
            return names.length ? names.join(", ") : "–";
          }),
        },
        ...(pet
          ? [
              {
                key: "pet",
                label: t("compare.forPet", { name: pet.name }),
                cells: rows.map((r) =>
                  r.fit?.allergy.excluded ? (
                    <span key={r.e.i} className="font-semibold text-danger">{t("compare.petNo")}</span>
                  ) : (
                    <span key={r.e.i}>{t("compare.petMatch", { score: r.fit?.score ?? "–" })}</span>
                  ),
                ),
              },
            ]
          : []),
        numberRow("g", t("compare.grams"), rows.map((r) => r.grams), (v) => `${v} g`, "none"),
        {
          key: "price",
          label: t("compare.price"),
          cells: rows.map((r) => (
            <label key={r.e.i} className="block">
              <span className="sr-only">{t("compare.priceFor", { name: r.e.n })}</span>
              <span className="flex items-center gap-1">
                <span aria-hidden>€</span>
                <input
                  inputMode="decimal"
                  value={prices[r.e.i] ?? (r.e.pc ? String(r.e.pc) : "")}
                  onChange={(ev) => setPrices((cur) => ({ ...cur, [r.e.i]: ev.target.value }))}
                  placeholder="0,00"
                  className="h-9 w-24 rounded-lg border border-line bg-paper px-2 text-sm focus:border-brand-mid focus:outline-none focus:ring-2 focus:ring-brand-soft"
                />
              </span>
              <span className="mt-1 block text-[0.7rem] text-ink-faint">{r.pack ? t("compare.perPack", { pack: r.e.pk }) : t("compare.perKg")}</span>
            </label>
          )),
        },
        numberRow("d", t("compare.perDay"), rows.map((r) => (r.perDay === null ? null : Math.round(r.perDay * 100) / 100)), money, "low"),
      ]
    : [];

  return (
    <div>
      {/* species */}
      <div role="tablist" aria-label={t("finder.species")} className="inline-flex rounded-2xl border border-line bg-paper p-1 shadow-sm">
        {(["dog", "cat"] as const).map((sp) => (
          <button
            key={sp}
            role="tab"
            type="button"
            aria-selected={species === sp}
            onClick={() => switchSpecies(sp)}
            className={`rounded-xl px-6 py-2.5 text-base font-semibold transition ${species === sp ? "bg-brand text-white shadow" : "text-ink-soft hover:bg-brand-tint"}`}
          >
            {speciesLabel(t, sp, true)}
          </button>
        ))}
      </div>

      {/* picker */}
      <div className="mt-6 max-w-2xl">
        <label htmlFor="cmp-q" className="mb-1.5 block text-sm font-semibold text-ink">
          {foods.length >= MAX_COMPARE ? t("compare.full", { max: MAX_COMPARE }) : t("compare.add")}
        </label>
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            id="cmp-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={foods.length >= MAX_COMPARE}
            placeholder={t("search.placeholder")}
            autoComplete="off"
            className="h-12 w-full rounded-2xl border border-line bg-paper pl-11 pr-4 text-base shadow-card focus:border-brand-mid focus:outline-none focus:ring-4 focus:ring-brand-soft disabled:opacity-60"
          />
        </div>
        {q.trim() && foods.length < MAX_COMPARE && (
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
            {!index && <li className="px-4 py-3 text-sm text-ink-faint">{t("common.loading")}</li>}
            {index && results.length === 0 && <li className="px-4 py-3 text-sm text-ink-faint">{t("compare.noResults")}</li>}
            {results.map((e) => (
              <li key={e.i}>
                <button type="button" onClick={() => add(e.i)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-tint">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                    <ProductImage ean={e.e} hasImage={e.im === 1} alt="" size={40} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold uppercase tracking-wide text-ink-faint">{e.b}</span>
                    <span className="block truncate text-sm text-ink">{e.n}</span>
                  </span>
                  <span className="shrink-0 font-mono text-sm font-semibold text-brand-deep">{e.sc ?? "–"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {failed && <p className="mt-6 text-danger" role="alert">{t("finder.error")}</p>}

      {foods.length === 0 && index && (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper p-8 text-center text-ink-soft">
          <p className="font-display text-xl font-semibold text-brand-deep">{t("compare.emptyTitle")}</p>
          <p className="mt-2">{t("compare.emptyText")}</p>
          <p className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <Link href={localePath(lang, "/best")} className="text-brand underline underline-offset-2">{t("nav.best")}</Link>
            <Link href={`${localePath(lang, "/foods")}?species=${species}`} className="text-brand underline underline-offset-2">{t("nav.foods")}</Link>
          </p>
        </div>
      )}

      {foods.length > 0 && (
        <>
          {/* who the portions are for */}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-brand/20 bg-brand-tint px-4 py-3 text-sm text-ink">
            <IconPaw className="h-5 w-5 text-brand" />
            {pet ? (
              <span>{t("compare.dailyForPet", { name: pet.name, kcal: energy.kcal })}</span>
            ) : (
              <>
                <label htmlFor="cmp-w">{t("compare.weight")}</label>
                <input
                  id="cmp-w"
                  inputMode="decimal"
                  value={weight}
                  placeholder={String(DEFAULT_WEIGHT[species])}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-9 w-20 rounded-lg border border-line bg-paper px-2"
                />
                <span className="text-ink-soft">{t("compare.dailyStandard", { kcal: energy.kcal })}</span>
                <Link href={localePath(lang, "/my-pet")} className="font-semibold text-brand underline underline-offset-2">{t("finder.createProfile")}</Link>
              </>
            )}
          </div>

          {/* relative: keeps the screen-reader-only labels inside the scroll box (else they widen the page on phones) */}
          <div className="relative mt-6 overflow-x-auto rounded-2xl border border-line bg-paper shadow-card">
            <div className="min-w-[36rem]">
              {/* food headers */}
              <div className="grid items-start gap-4 border-b border-line p-4" style={grid}>
                <span className={label}>{t("compare.food")}</span>
                {rows.map(({ e }) => {
                  const grade = e.g ?? gradeOf(e.sc);
                  return (
                    <div key={e.i} className="flex flex-col items-start gap-2">
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
                          <ProductImage ean={e.e} hasImage={e.im === 1} alt="" size={64} />
                        </span>
                        <button type="button" onClick={() => remove(e.i)} aria-label={t("compare.remove", { name: e.n })} className="rounded-lg p-1.5 text-ink-faint hover:bg-cream hover:text-ink">
                          <IconX className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink-faint">{e.b}</span>
                      <Link href={localePath(lang, `/foods/${e.s}`)} prefetch={false} className="line-clamp-3 font-display text-[0.98rem] font-semibold leading-snug text-ink hover:text-brand-deep hover:underline">
                        {e.n}
                      </Link>
                      <div className="flex items-center gap-2">
                        <ScoreRing score={e.sc} grade={grade} size={52} label={scoreAria(t, e.sc, grade)} />
                        {grade && <GradeBadge grade={grade} label={gradeLabel(t, grade)} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              {table.map((row) => (
                <div key={row.key} className="grid items-center gap-4 border-b border-line px-4 py-2.5 text-sm last:border-b-0 even:bg-cream/40" style={grid}>
                  <span className="text-ink-soft">{row.label}</span>
                  {row.cells.map((c, i) => (
                    <div key={i} className="text-ink">{c}</div>
                  ))}
                </div>
              ))}
              <div className="grid items-center gap-4 px-4 py-4" style={grid}>
                <span />
                {rows.map(({ e }) => (
                  <a
                    key={e.i}
                    href={zooplusAffiliateUrl({ brand: e.b, name: e.n }, `scanabowl-${lang}-compare`)}
                    target="_blank"
                    rel="sponsored nofollow noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-deep"
                  >
                    {t("order.zooplusButton")}
                    <IconExternal className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-faint">{t("compare.note")}</p>
        </>
      )}
    </div>
  );
}
