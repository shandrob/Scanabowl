import Link from "next/link";
import { GradeBadge, gradeOf } from "@/components/ui/grade";
import { ProductImage } from "@/components/ui/ProductImage";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { ProductDetail } from "@/lib/data/types";
import type { GuideDef } from "@/lib/guides/defs";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { foodTypeLabel, gradeLabel, scoreAria, stageLabel } from "@/lib/labels";

const num = (v: number, lang: Locale, digits = 0) => v.toLocaleString(lang, { maximumFractionDigits: digits, minimumFractionDigits: digits });

/** One ranked food in a "best food for ..." list: photo, score, and the numbers that matter. */
export function GuideItem({ p, rank, def, lang, t }: { p: ProductDetail; rank: number; def: GuideDef; lang: Locale; t: TFunction }) {
  const grade = p.grade ?? gradeOf(p.score);
  const n = p.nutrition;
  const href = localePath(lang, `/foods/${p.slug}`);
  const facts: string[] = [];
  if (n) {
    facts.push(t("guides.factProtein", { value: num(n.dm.protein, lang) }));
    facts.push(t("guides.factFat", { value: num(n.dm.fat, lang) }));
    facts.push(t("guides.factKcal", { value: num(n.kcalPer100g, lang) }));
    if (def.facts?.includes("moisture")) facts.push(t("guides.factMoisture", { value: num(n.asFed.moisture, lang) }));
    if (def.facts?.includes("calcium")) {
      facts.push(n.dm.calcium ? t("guides.factCalcium", { value: num(n.dm.calcium, lang, 1) }) : t("guides.factCalciumUnknown"));
    }
  }
  if (p.animalProteinShare !== null) facts.push(t("guides.factAnimal", { pct: Math.round(p.animalProteinShare * 100) }));

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 shadow-card sm:flex-row sm:items-center sm:p-5">
      <div className="flex items-center gap-4 sm:contents">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-base font-semibold tabular-nums text-brand-deep" aria-label={t("guides.rank", { n: rank })}>
          {rank}
        </span>
        <Link href={href} prefetch={false} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream p-1" tabIndex={-1} aria-hidden>
          <ProductImage ean={p.ean} hasImage={!!p.image} alt="" size={96} />
        </Link>
        <div className="flex shrink-0 flex-col items-center gap-1.5 sm:order-last">
          <ScoreRing score={p.score} grade={grade} size={64} label={scoreAria(t, p.score, grade)} />
          {grade && <GradeBadge grade={grade} label={gradeLabel(t, grade)} />}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-xs font-semibold text-ink-faint">{p.brand}</p>
        <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug tracking-tight text-ink">
          <Link href={href} prefetch={false} className="hover:text-brand-deep hover:underline">{p.name}</Link>
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5 font-sans text-xs text-ink-soft">
          <span className="rounded-md bg-stone px-2 py-0.5">{foodTypeLabel(t, p.foodType)}</span>
          <span className="rounded-md bg-stone px-2 py-0.5">{stageLabel(t, p.lifeStage, p.species)}</span>
          {p.grainFree && <span className="rounded-md bg-brand-soft px-2 py-0.5 font-medium text-brand-deep">{t("common.grainFree")}</span>}
        </div>
        {facts.length > 0 && <p className="mt-2 font-sans text-xs tabular-nums text-ink-soft">{facts.join(" · ")}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={href} prefetch={false} className="font-sans text-sm font-semibold text-brand hover:underline">{t("guides.view")} →</Link>
        </div>
      </div>
    </article>
  );
}
