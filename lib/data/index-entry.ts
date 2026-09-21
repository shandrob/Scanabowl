import type { IndexEntry, ProductDetail } from "./types";

/** Slim record for the browser, derived from the full product record (single source of truth). */
export function detailToIndex(d: ProductDetail): IndexEntry {
  const n = d.nutrition;
  return {
    i: d.id,
    e: d.ean,
    s: d.slug,
    n: d.name,
    b: d.brand,
    t: d.foodType,
    l: d.lifeStage,
    c: d.category,
    sc: d.score,
    g: d.grade,
    gf: d.grainFree ? 1 : 0,
    im: d.image ? 1 : 0,
    ad: d.allergens.definite,
    ap: d.allergens.possible,
    pr: d.proteins,
    k: n ? Math.round(n.kcalPer100g) : null,
    pk: d.pack,
    cf: d.confidence,
    nu: n
      ? [
          Math.round(n.dm.protein * 10) / 10,
          Math.round(n.dm.fat * 10) / 10,
          Math.round(n.energyShare.fat),
          Math.round(n.dm.ash * 10) / 10,
          Math.round((n.dm.calcium ?? 0) * 100) / 100,
        ]
      : null,
    ...(d.price ? { pc: d.price } : {}),
  };
}
