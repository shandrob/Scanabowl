/** Lower-case, strip accents, unify whitespace. Used before every regex match. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/gi, "oe")
    .replace(/ß/g, "ss")
    .replace(/[   ]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse a number as printed on Dutch/English labels: "31,0", "9.0", "4.216", "1,250". */
export function parseLabelNumber(raw: string, opts: { thousandsOk?: boolean } = {}): number | undefined {
  let s = raw.trim();
  if (!s) return undefined;
  if (opts.thousandsOk && /^\d{1,3}([.,]\d{3})+$/.test(s)) {
    s = s.replace(/[.,]/g, "");
  } else {
    s = s.replace(",", ".");
  }
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Piecewise-linear interpolation through [x, y] anchor points (sorted by x). */
export function lin(x: number, anchors: Array<[number, number]>): number {
  if (x <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i];
    if (x <= x1) {
      const [x0, y0] = anchors[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return anchors[anchors.length - 1][1];
}

export function round(n: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
