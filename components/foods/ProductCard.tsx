import Link from "next/link";
import { GradeBadge, GRADE_STYLE, gradeOf } from "@/components/ui/grade";
import { ProductImage } from "@/components/ui/ProductImage";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { IndexEntry } from "@/lib/data/types";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { foodTypeLabel, gradeLabel, scoreAria, stageLabel } from "@/lib/labels";
import { packGrams } from "@/lib/pets/energy";
import type { Species } from "@/lib/scoring/types";

/** Pure component - used on the server (home page) and in the client-side finder. */
export function ProductCard({
  entry,
  species,
  lang,
  t,
  personalScore,
  petName,
}: {
  entry: IndexEntry;
  species: Species;
  lang: Locale;
  t: TFunction;
  personalScore?: number | null;
  petName?: string;
}) {
  const grade = entry.g ?? gradeOf(entry.sc);
  const showPersonal = personalScore !== undefined && personalScore !== null && entry.sc !== null && personalScore !== entry.sc;
  const grams = entry.pk ? packGrams(entry.pk) : null;
  const perKg = entry.pc && grams && grams > 0 ? (entry.pc / (grams / 1000)).toFixed(2) : null;

  return (
    <Link
      href={localePath(lang, `/foods/${entry.s}`)}
      // Do not pre-load every card in a list: each pre-load makes the server render (and store) a page that
      // the visitor may never open. The page loads when it is clicked.
      prefetch={false}
      className="group flex gap-4 rounded-xl border border-line bg-paper p-4 shadow-card transition hover:border-brand-mid/50 hover:shadow-lift focus-visible:outline-offset-4"
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-white p-1">
        <ProductImage ean={entry.e} hasImage={entry.im === 1} alt="" size={96} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-xs font-semibold text-ink-faint">{entry.b}</p>
        <h3 className="mt-0.5 line-clamp-2 font-display text-[1.04rem] font-semibold leading-snug text-ink group-hover:text-brand-deep">
          {entry.n}
        </h3>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 font-sans text-xs text-ink-soft">
          <span className="rounded-md bg-stone px-2 py-0.5">{foodTypeLabel(t, entry.t)}</span>
          <span className="rounded-md bg-stone px-2 py-0.5">{stageLabel(t, entry.l, species)}</span>
          {entry.gf === 1 && <span className="rounded-md bg-brand-soft px-2 py-0.5 font-medium text-brand-deep">{t("common.grainFree")}</span>}
          {perKg ? (
            <span className="rounded-md bg-stone px-2 py-0.5 font-mono text-[0.72rem] font-semibold tabular-nums text-ink-soft">{t("order.perKg", { price: perKg })}</span>
          ) : entry.pc ? (
            <span className="rounded-md bg-stone px-2 py-0.5 font-mono text-[0.72rem] font-semibold tabular-nums text-ink-soft">€{entry.pc.toFixed(2)}</span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center justify-center gap-1.5">
        <ScoreRing score={entry.sc} grade={grade} size={62} label={scoreAria(t, entry.sc, grade)} />
        {grade ? (
          <GradeBadge grade={grade} label={gradeLabel(t, grade)} />
        ) : (
          <span className="rounded-full bg-stone px-2.5 py-0.5 font-sans text-xs text-ink-faint">{t("score.notScoredShort")}</span>
        )}
        {showPersonal && (
          <span className={`font-sans text-xs font-semibold tabular-nums ${grade ? GRADE_STYLE[grade].text : "text-ink-soft"}`}>
            {t("finder.forPet", { name: petName ?? "", score: personalScore! })}
          </span>
        )}
      </div>
    </Link>
  );
}
