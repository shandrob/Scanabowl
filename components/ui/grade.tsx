import { gradeFor } from "@/lib/scoring/score";
import type { Grade } from "@/lib/scoring/types";

/** Static class names so Tailwind can see them (Yuka-style clear score pills). */
export const GRADE_STYLE: Record<Grade, { text: string; soft: string; solid: string; stroke: string; border: string }> = {
  A: { text: "text-grade-a", soft: "bg-grade-a-soft", solid: "bg-grade-a", stroke: "#16A34A", border: "border-grade-a/30" },
  B: { text: "text-grade-b", soft: "bg-grade-b-soft", solid: "bg-grade-b", stroke: "#4D7C0F", border: "border-grade-b/30" },
  C: { text: "text-grade-c", soft: "bg-grade-c-soft", solid: "bg-grade-c", stroke: "#D97706", border: "border-grade-c/30" },
  D: { text: "text-grade-d", soft: "bg-grade-d-soft", solid: "bg-grade-d", stroke: "#EA580C", border: "border-grade-d/30" },
  E: { text: "text-grade-e", soft: "bg-grade-e-soft", solid: "bg-grade-e", stroke: "#DC2626", border: "border-grade-e/30" },
};

export function gradeOf(score: number | null | undefined): Grade | null {
  return score === null || score === undefined ? null : gradeFor(score);
}

export function GradeBadge({ grade, label, className = "" }: { grade: Grade; label: string; className?: string }) {
  const s = GRADE_STYLE[grade];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold ${s.soft} ${s.text} ${className}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${s.solid}`} aria-hidden />
      {label}
    </span>
  );
}
