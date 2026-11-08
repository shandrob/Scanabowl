"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/components/i18n/DictionaryProvider";
import { IconSearch } from "@/components/ui/Icons";
import { ProductImage } from "@/components/ui/ProductImage";
import { loadIndex } from "@/lib/data/client";
import type { IndexEntry } from "@/lib/data/types";
import type { Species } from "@/lib/scoring/types";
import { matchesQuery, queryTerms, searchHaystack } from "@/lib/search";

/** Search box that lets the visitor pick one food from the index (name, brand or barcode). */
export function FoodPicker({ id, species, onPick, label }: { id: string; species: Species; onPick: (e: IndexEntry) => void; label: string }) {
  const t = useT();
  const [q, setQ] = useState("");
  const [loaded, setLoaded] = useState<{ species: Species; data: IndexEntry[] } | null>(null);
  // the index (a few hundred kB) is only fetched once the visitor starts typing
  const wanted = q.trim().length > 0;
  useEffect(() => {
    if (!wanted) return;
    let alive = true;
    loadIndex(species)
      .then((data) => alive && setLoaded({ species, data }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [wanted, species]);
  const index = loaded?.species === species ? loaded.data : null;

  const results = useMemo(() => {
    const terms = queryTerms(q);
    if (!index || !terms.length) return [];
    const out: IndexEntry[] = [];
    for (const e of index) {
      if (matchesQuery(searchHaystack(e.b, e.n, e.e), terms)) out.push(e);
      if (out.length >= 8) break;
    }
    return out;
  }, [index, q]);

  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search.placeholder")}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-line bg-paper pl-11 pr-4 font-sans text-base text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
        />
      </div>
      {wanted && (
        <ul className="mt-1.5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper shadow-lift">
          {!index && <li className="px-4 py-3 font-sans text-sm text-ink-faint">{t("common.loading")}</li>}
          {index && results.length === 0 && <li className="px-4 py-3 font-sans text-sm text-ink-faint">{t("compare.noResults")}</li>}
          {results.map((e) => (
            <li key={e.i}>
              <button
                type="button"
                onClick={() => {
                  onPick(e);
                  setQ("");
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-stone"
              >
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream p-0.5">
                  <ProductImage ean={e.e} hasImage={e.im === 1} alt="" size={40} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-sans text-xs font-medium text-ink-soft">{e.b}</span>
                  <span className="block truncate font-sans text-sm font-medium text-ink">{e.n}</span>
                </span>
                <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 font-sans text-xs font-semibold tabular-nums text-brand-deep">{e.sc ?? "–"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
