"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { BarcodeScanner } from "./BarcodeScanner";
import { IconBarcode, IconSearch } from "@/components/ui/Icons";
import { reportNoResults, trackBarcodeScan } from "@/lib/analytics";
import { slugify } from "@/lib/catalog/clean";
import { loadIndex } from "@/lib/data/client";
import type { IndexEntry } from "@/lib/data/types";
import { localePath } from "@/lib/i18n/config";
import { foodTypeLabel, speciesLabel } from "@/lib/labels";
import type { Species } from "@/lib/scoring/types";
import { matchesQuery, queryTerms, searchHaystack } from "@/lib/search";

function scorePillStyle(score: number | null): { dot: string; pill: string } {
  if (score === null) return { dot: "bg-ink-faint", pill: "bg-stone text-ink-soft" };
  if (score >= 75) return { dot: "bg-grade-a", pill: "bg-grade-a-soft text-grade-a" };
  if (score >= 50) return { dot: "bg-grade-c", pill: "bg-grade-c-soft text-grade-c" };
  return { dot: "bg-grade-e", pill: "bg-grade-e-soft text-grade-e" };
}

/**
 * Search field used on the home page and in the finder.
 * Typing a barcode (8-14 digits) - or scanning one - jumps straight to that product;
 * anything else searches by name/brand, with an instant autocomplete preview when used on the home page.
 */
export function SearchBox({
  initial = "",
  species,
  size = "lg",
  live,
  autoFocus = false,
  onNavigate,
}: {
  initial?: string;
  species?: "dog" | "cat";
  size?: "lg" | "md";
  /** controlled mode used by the food finder: typing filters the list live */
  live?: { value: string; onChange: (v: string) => void };
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const [inner, setInner] = useState(initial);
  const value = live ? live.value : inner;
  const setValue = live ? live.onChange : setInner;
  const [scanning, setScanning] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [catalog, setCatalog] = useState<Array<{ entry: IndexEntry; sp: Species }> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const ensureCatalog = useCallback(() => {
    if (live || catalog) return;
    Promise.all([loadIndex("dog"), loadIndex("cat")])
      .then(([dogs, cats]) => {
        setCatalog([
          ...dogs.map((entry) => ({ entry, sp: "dog" as Species })),
          ...cats.map((entry) => ({ entry, sp: "cat" as Species })),
        ]);
      })
      .catch(() => {});
  }, [live, catalog]);

  useEffect(() => {
    if (live) return;
    const onClickOutside = (ev: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [live]);

  const suggestions = useMemo(() => {
    if (live || !catalog) return { foods: [], brands: [] };
    const q = value.trim();
    if (q.length < 2 || /^\d{6,14}$/.test(q.replace(/[\s-]/g, ""))) return { foods: [], brands: [] };
    const terms = queryTerms(q);
    if (!terms.length) return { foods: [], brands: [] };

    const matchedBrands = new Map<string, { name: string; slug: string; count: number }>();
    const matchedFoods: Array<{ entry: IndexEntry; sp: Species }> = [];

    for (const item of catalog) {
      if (species && item.sp !== species) continue;
      if (matchesQuery(searchHaystack(item.entry.b, "", ""), terms) && item.entry.b.toLowerCase() !== "overig") {
        const bSlug = slugify(item.entry.b);
        const prev = matchedBrands.get(bSlug);
        matchedBrands.set(bSlug, { name: item.entry.b, slug: bSlug, count: (prev?.count ?? 0) + 1 });
      }
      if (matchesQuery(searchHaystack(item.entry.b, item.entry.n, item.entry.e), terms)) {
        matchedFoods.push(item);
      }
    }

    matchedFoods.sort((a, b) => (b.entry.sc ?? -1) - (a.entry.sc ?? -1) || Number(b.entry.im) - Number(a.entry.im));

    return {
      brands: [...matchedBrands.values()].sort((a, b) => b.count - a.count).slice(0, 3),
      foods: matchedFoods.slice(0, 6),
    };
  }, [live, catalog, value, species]);

  const lookup = useCallback(
    async (ean: string) => {
      setBusy(true);
      setMissing(null);
      try {
        const res = await fetch(`/api/ean/${ean}`);
        if (res.ok) {
          const { slug } = (await res.json()) as { slug: string };
          trackBarcodeScan(lang, true, slug);
          onNavigate?.();
          router.push(localePath(lang, `/foods/${slug}`));
          return;
        }
        setMissing(ean);
        if (res.status === 404) {
          trackBarcodeScan(lang, false, ean);
          reportNoResults(lang, ean, "barcode");
        }
      } catch {
        setMissing(ean);
      } finally {
        setBusy(false);
      }
    },
    [lang, router, onNavigate],
  );

  const big = size === "lg";
  const showDropdown = !live && open && (suggestions.brands.length > 0 || suggestions.foods.length > 0);
  const clampedActive = activeIndex >= 0 && activeIndex < suggestions.foods.length ? activeIndex : -1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showDropdown && clampedActive >= 0) {
      const picked = suggestions.foods[clampedActive];
      if (picked) {
        setOpen(false);
        onNavigate?.();
        router.push(localePath(lang, `/foods/${picked.entry.s}`));
        return;
      }
    }
    setOpen(false);
    const q = value.trim();
    if (!q) return;
    if (/^\d{8,14}$/.test(q.replace(/[\s-]/g, ""))) {
      void lookup(q.replace(/[\s-]/g, ""));
      return;
    }
    if (live) return; // the list is already filtered while typing
    const params = new URLSearchParams({ q });
    if (species) params.set("species", species);
    onNavigate?.();
    router.push(`${localePath(lang, "/foods")}?${params.toString()}`);
  };

  const onDetect = useCallback(
    (code: string) => {
      setScanning(false);
      setValue(code);
      void lookup(code);
    },
    [lookup, setValue],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.foods.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.foods.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.foods.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <form onSubmit={submit} role="search" className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-stretch">
        <div className="relative col-span-2 sm:min-w-[14rem] sm:flex-[1_1_16rem]">
          <IconSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint ${big ? "h-5 w-5" : "h-4 w-4"}`} />
          <input
            type="search"
            inputMode="search"
            autoFocus={autoFocus}
            value={value}
            role={live ? undefined : "combobox"}
            aria-expanded={live ? undefined : showDropdown}
            aria-controls={live ? undefined : "search-suggestions"}
            aria-activedescendant={showDropdown && clampedActive >= 0 ? `search-opt-${clampedActive}` : undefined}
            onFocus={() => {
              ensureCatalog();
              setOpen(true);
            }}
            onChange={(e) => {
              ensureCatalog();
              setValue(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onKeyDown={onKeyDown}
            placeholder={t("search.placeholder")}
            aria-label={t("search.label")}
            className={`w-full rounded-xl border border-[#D6D1C7] bg-paper pl-12 pr-4 font-sans text-ink shadow-sm placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand-soft ${big ? "h-14 text-base sm:text-lg" : "h-12 text-base"}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setScanning(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-paper px-4 font-sans text-sm font-semibold text-brand-deep shadow-sm transition hover:border-brand-mid hover:bg-brand-soft ${big ? "h-12 sm:h-14 sm:text-base" : "h-12"}`}
          aria-label={t("search.scan")}
        >
          <IconBarcode className="h-5 w-5 text-brand" />
          <span>{t("search.scan")}</span>
        </button>
        <button
          type="submit"
          disabled={busy}
          className={`rounded-lg bg-brand px-6 font-sans text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deep disabled:opacity-60 ${big ? "h-12 sm:h-14 sm:text-base" : "h-12"}`}
        >
          {busy ? t("common.loading") : t("search.button")}
        </button>
      </form>

      {/* Instant Autocomplete Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-paper shadow-lift">
          {suggestions.brands.length > 0 && (
            <div className="border-b border-line bg-cream/60 px-4 py-2.5">
              <p className="font-sans text-xs font-semibold text-ink-soft">{t("nav.allBrands")}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {suggestions.brands.map((b) => (
                  <Link
                    key={b.slug}
                    href={localePath(lang, `/foods/brand/${b.slug}`)}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD5] bg-paper px-3 py-1 font-sans text-xs font-semibold text-brand-deep shadow-sm transition hover:border-brand-mid hover:bg-brand-soft"
                  >
                    <span>{b.name}</span>
                    <span className="tabular-nums text-ink-faint">({b.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {suggestions.foods.length > 0 && (
            <ul id="search-suggestions" role="listbox" className="divide-y divide-line">
              {suggestions.foods.map(({ entry, sp }, idx) => {
                const st = scorePillStyle(entry.sc);
                const isActive = idx === clampedActive;
                return (
                  <li key={entry.i} id={`search-opt-${idx}`} role="option" aria-selected={isActive}>
                    <Link
                      href={localePath(lang, `/foods/${entry.s}`)}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className={`flex items-center justify-between gap-3 px-4 py-3 transition ${isActive ? "bg-brand-soft/60" : "hover:bg-cream"}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-sm font-semibold text-ink">{entry.n}</p>
                        <p className="mt-0.5 font-sans text-xs text-ink-soft">
                          {entry.b} · {speciesLabel(t, sp)} · {foodTypeLabel(t, entry.t)}
                          {entry.pk ? ` · ${entry.pk}` : ""}
                        </p>
                      </div>
                      {entry.sc !== null ? (
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-bold tabular-nums ${st.pill}`}>
                          <span className={`h-2 w-2 rounded-full ${st.dot}`} aria-hidden />
                          {entry.sc}/100
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-stone px-2.5 py-1 font-sans text-xs text-ink-soft">
                          {t("score.notScoredShort")}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-line bg-cream/60 px-4 py-2.5 text-right">
            <button
              type="button"
              onClick={submit}
              className="font-sans text-xs font-semibold text-brand hover:underline"
            >
              {t("search.seeAllResults", { q: value.trim() })} →
            </button>
          </div>
        </div>
      )}

      {missing && (
        <p className="mt-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 font-sans text-sm text-ink" role="status">
          {t("search.notFound", { ean: missing })}{" "}
          <Link href={`${localePath(lang, "/suggest")}?ean=${missing}`} className="font-semibold text-brand underline underline-offset-2">
            {t("search.suggestIt")}
          </Link>
        </p>
      )}
      {scanning && <BarcodeScanner onDetect={onDetect} onClose={() => setScanning(false)} />}
    </div>
  );
}
