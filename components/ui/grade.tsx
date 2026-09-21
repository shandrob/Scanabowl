import { gradeFor } from "@/lib/scoring/score";
import type { Grade } from "@/lib/scoring/types";

/** Static class names so Tailwind can see them. */
export const GRADE_STYLE: Record<Grade, { text: string; soft: string; solid: string; stroke: string; border: string }> = {
  A: { text: "text-grade-a", soft: "bg-grade-a-soft", solid: "bg-grade-a", stroke: "#15803d", border: "border-grade-a/30" },
  B: { text: "text-grade-b", soft: "bg-grade-b-soft", solid: "bg-grade-b", stroke: "#4d7c0f", border: "border-grade-b/30" },
  C: { text: "text-grade-c", soft: "bg-grade-c-soft", solid: "bg-grade-c", stroke: "#a16207", border: "border-grade-c/30" },
  D: { text: "text-grade-d", soft: "bg-grade-d-soft", solid: "bg-grade-d", stroke: "#c2410c", border: "border-grade-d/30" },
  E: { text: "text-grade-e", soft: "bg-grade-e-soft", solid: "bg-grade-e", stroke: "#b91c1c", border: "border-grade-e/30" },
};

export function gradeOf(score: number | null | undefined): Grade | null {
  return score === null || score === undefined ? null : gradeFor(score);
}

export function GradeBadge({ grade, label, className = "" }: { grade: Grade; label: string; className?: string }) {
  const s = GRADE_STYLE[grade];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.soft} ${s.text} ${className}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${s.solid}`} aria-hidden />
      {label}
    </span>
  );
}
