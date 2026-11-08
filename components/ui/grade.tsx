import { gradeFor } from "@/lib/scoring/score";
import type { Grade } from "@/lib/scoring/types";

/** Static class names so Tailwind can see them. */
export const GRADE_STYLE: Record<Grade, { text: string; soft: string; solid: string; stroke: string; border: string }> = {
  A: { text: "text-grade-a", soft: "bg-grade-a-soft", solid: "bg-grade-a", stroke: "#2D6A4F", border: "border-grade-a/40" },
  B: { text: "text-grade-b", soft: "bg-grade-b-soft", solid: "bg-grade-b", stroke: "#3F6212", border: "border-grade-b/40" },
  C: { text: "text-grade-c", soft: "bg-grade-c-soft", solid: "bg-grade-c", stroke: "#B45309", border: "border-grade-c/40" },
  D: { text: "text-grade-d", soft: "bg-grade-d-soft", solid: "bg-grade-d", stroke: "#C2410C", border: "border-grade-d/40" },
  E: { text: "text-grade-e", soft: "bg-grade-e-soft", solid: "bg-grade-e", stroke: "#991B1B", border: "border-grade-e/40" },
};

export function gradeOf(score: number | null | undefined): Grade | null {
  return score === null || score === undefined ? null : gradeFor(score);
}

export function GradeBadge({ grade, label, className = "" }: { grade: Grade; label: string; className?: string }) {
  const s = GRADE_STYLE[grade];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider tabular-nums ${s.border} ${s.soft} ${s.text} ${className}`}>
      <span className={`inline-block h-2 w-2 rounded-none ${s.solid}`} aria-hidden />
      {label}
    </span>
  );
}
