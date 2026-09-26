import { SITE } from "./site";

/**
 * zooplus affiliate links, through the Awin network (zooplus NL-BE programme).
 *
 *   https://www.awin1.com/cread.php?awinmid=<zooplus merchant id>&awinaffid=<publisher id>&clickref=<ref>&ued=<target>
 *
 * zooplus.nl cannot search by barcode, so the link opens a zooplus search for the brand and product name.
 * zooplus does not sell every brand; the visitor then sees zooplus' closest alternatives. Once zooplus has
 * approved the publisher account, Awin also offers a product feed with EANs - that would allow exact product
 * links (put them in a "zooplus_url" column, the same way bol_url works).
 */
export interface ZooplusTarget {
  brand: string;
  name: string;
}

/** Words and pack sizes that only make a zooplus search worse. */
const NOISE =
  /\b(\d+\s*x\s*)?\d+(?:[.,]\d+)?\s*(kg|g|gram|ml|l)\b|\b(hondenvoer|kattenvoer|natvoer|droogvoer|hondenbrokken|kattenbrokken|maaltijdzakjes?|multipack|voordeelverpakking|bonuspack|promo|graanvrij|glutenvrij|compleet|kittens?-?kattenvoer|puppy-?hondenvoer)\b/gi;

export function zooplusSearchQuery(p: ZooplusTarget): string {
  let q = p.name.replace(/&/g, " ").replace(NOISE, " ").replace(/[-–|,]+/g, " ").replace(/\s+/g, " ").trim();
  if (p.brand && !q.toLowerCase().startsWith(p.brand.toLowerCase())) q = `${p.brand} ${q}`;
  // the first few words carry the brand and product line; long queries find nothing
  return q.split(" ").slice(0, 6).join(" ");
}

export function zooplusTargetUrl(p: ZooplusTarget): string {
  return `https://www.zooplus.nl/search/results?q=${encodeURIComponent(zooplusSearchQuery(p))}`;
}

export function zooplusAffiliateUrl(p: ZooplusTarget, clickRef: string): string {
  const target = zooplusTargetUrl(p);
  if (!SITE.awin.publisherId || !SITE.awin.zooplusMerchantId) return target;
  const params = new URLSearchParams({
    awinmid: SITE.awin.zooplusMerchantId,
    awinaffid: SITE.awin.publisherId,
    clickref: clickRef.slice(0, 50),
    ued: target,
  });
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}
