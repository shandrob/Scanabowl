import { GRADE_STYLE } from "@/components/ui/grade";
import type { TFunction } from "@/lib/i18n/t";
import { gradeLabel } from "@/lib/labels";
import type { Grade } from "@/lib/scoring/types";

const ORDER: Grade[] = ["A", "B", "C", "D", "E"];

/** Horizontal bar showing how many foods fall in each grade, with a legend. */
export function GradeBar({ grades, t }: { grades: Record<Grade, number>; t: TFunction }) {
  const total = ORDER.reduce((s, g) => s + grades[g], 0);
  if (!total) return null;
  const label = ORDER.filter((g) => grades[g]).map((g) => `${gradeLabel(t, g)}: ${grades[g]}`).join(", ");
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-line/60" role="img" aria-label={label}>
        {ORDER.map((g) => (grades[g] ? <div key={g} className={GRADE_STYLE[g].solid} style={{ width: `${(grades[g] / total) * 100}%` }} /> : null))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        {ORDER.filter((g) => grades[g]).map((g) => (
          <li key={g} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${GRADE_STYLE[g].solid}`} aria-hidden />
            {g} · {gradeLabel(t, g)} ({grades[g]})
          </li>
        ))}
      </ul>
    </div>
  );
}
