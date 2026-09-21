import type { Grade } from "@/lib/scoring/types";
import { GRADE_STYLE, gradeOf } from "./grade";

/**
 * Circular score gauge. Accessible: exposes the value as text via aria-label,
 * the number itself is real text (not just graphics).
 */
export function ScoreRing({
  score,
  grade,
  size = 96,
  label,
  animate = false,
}: {
  score: number | null;
  grade?: Grade | null;
  size?: number;
  label: string;
  animate?: boolean;
}) {
  const g = grade ?? gradeOf(score);
  const stroke = Math.max(5, Math.round(size / 12));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const color = g ? GRADE_STYLE[g].stroke : "#94a3b8";
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8e2d3" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={animate ? "ring-anim" : undefined}
          style={animate ? ({ ["--ring-len" as string]: c } as React.CSSProperties) : undefined}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-mono font-semibold text-ink" style={{ fontSize: size * 0.34 }}>
          {score === null ? "–" : score}
        </span>
        {size >= 84 && score !== null && <span className="mt-0.5 font-mono text-ink-faint" style={{ fontSize: size * 0.13 }}>/100</span>}
      </div>
    </div>
  );
}
