"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/DictionaryProvider";
import type { IngredientView } from "@/lib/data/types";
import { kindGroup, type KindGroup } from "@/lib/labels";

const GROUP_STYLE: Record<KindGroup, { chip: string; badge: string }> = {
  animal: { chip: "border-grade-a/40 bg-grade-a-soft text-ink", badge: "bg-grade-a-soft text-grade-a" },
  fat: { chip: "border-brand/40 bg-stone text-ink", badge: "bg-brand-soft text-brand-deep" },
  plant: { chip: "border-warn/40 bg-warn-soft text-ink", badge: "bg-warn-soft text-warn" },
  other: { chip: "border-line bg-cream text-ink-soft", badge: "bg-stone text-ink-soft" },
};

const UNNEEDED = new Set(["sugar", "colourant", "preservative"]);

function explainKindKey(kind: string, named: boolean): string {
  if (UNNEEDED.has(kind)) return "product.ingExplain.unneeded";
  if (kind === "generic_animal" || (!named && kindGroup(kind) === "animal")) return "product.ingExplain.vagueAnimal";
  if (kind === "meat" || kind === "fish" || kind === "egg" || kind === "dairy" || kind === "insect") return "product.ingExplain.namedAnimal";
  if (kind === "fish_oil") return "product.ingExplain.fishOil";
  if (kind === "animal_fat" || kind === "plant_oil") return "product.ingExplain.fatOil";
  if (kind === "cereal_protein" || kind === "legume_protein") return "product.ingExplain.plantProtein";
  if (kind === "cereal" || kind === "legume" || kind === "tuber") return "product.ingExplain.carbSource";
  if (kind === "veg_fruit" || kind === "fibre" || kind === "yeast" || kind === "prebiotic") return "product.ingExplain.fibreVeg";
  return "product.ingExplain.other";
}

export function IngredientInspector({ ingredients }: { ingredients: IngredientView[] }) {
  const t = useT();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selected = selectedIdx !== null ? ingredients[selectedIdx] ?? null : null;

  return (
    <div className="mt-5">
      <p className="mb-2.5 font-sans text-xs font-medium text-ink-soft">
        {t("product.tapIngredientHint")}
      </p>
      <ol className="flex flex-wrap gap-2">
        {ingredients.map((i, idx) => {
          const isSelected = selectedIdx === idx;
          const group = kindGroup(i.kind);
          const unneeded = UNNEEDED.has(i.kind);
          return (
            <li key={`${i.raw}-${idx}`}>
              <button
                type="button"
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                aria-expanded={isSelected}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 font-sans text-sm transition ${
                  idx < 5 ? "font-medium" : ""
                } ${
                  unneeded
                    ? "border-danger/40 bg-danger-soft font-semibold text-danger"
                    : `${GROUP_STYLE[group].chip}${!i.named && group !== "other" ? " border-dashed border-ink-faint" : ""}`
                } ${isSelected ? "ring-2 ring-brand shadow-sm" : "hover:brightness-95"}`}
              >
                <span>{i.raw}</span>
                {!i.named && !unneeded && group !== "other" && (
                  <span className="ml-1 text-ink-faint" aria-hidden>?</span>
                )}
                {i.pct !== undefined && (
                  <span className="ml-1.5 font-semibold tabular-nums text-ink">{i.pct}%</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {selected && (
        <div className="mt-3.5 rounded-xl border border-line bg-cream/80 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-base font-semibold text-ink">{selected.raw}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold ${
                  UNNEEDED.has(selected.kind)
                    ? "bg-danger-soft text-danger"
                    : GROUP_STYLE[kindGroup(selected.kind)].badge
                }`}
              >
                {t(`product.group.${kindGroup(selected.kind)}`)}
              </span>
              {selected.pct !== undefined ? (
                <span className="rounded-full bg-paper px-2.5 py-0.5 font-sans text-xs font-semibold tabular-nums text-ink-soft border border-line">
                  {t("product.ingDeclaredPct", { pct: selected.pct })}
                </span>
              ) : (
                <span className="rounded-full bg-paper px-2.5 py-0.5 font-sans text-xs font-semibold tabular-nums text-ink-soft border border-line">
                  {t("product.ingEstimatedPct", { pct: Math.max(1, Math.round(selected.share)) })}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedIdx(null)}
              className="font-sans text-xs font-semibold text-ink-soft hover:text-ink"
            >
              {t("common.close")} ✕
            </button>
          </div>
          <p className="mt-2 font-sans text-sm leading-relaxed text-ink-soft">
            {t(explainKindKey(selected.kind, selected.named))}
          </p>
        </div>
      )}
    </div>
  );
}
