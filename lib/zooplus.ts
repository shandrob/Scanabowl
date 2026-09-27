import { SITE } from "./site";

/**
 * zooplus affiliate links, through the Awin network (zooplus NL-BE programme).
 *
 *   https://www.awin1.com/cread.php?awinmid=<zooplus merchant id>&awinaffid=<publisher id>&clickref=<ref>&ued=<target>
 *
 * zooplus.nl cannot search by barcode. Foods found in the zooplus product file from Awin (npm run data:zooplus)
 * get their exact product page; all others open a zooplus search for the brand and product name. zooplus does
 * not sell every brand; the visitor then sees zooplus' closest alternatives.
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
  return awinWrap(zooplusTargetUrl(p), clickRef);
}

/** Only real zooplus pages (or Awin's own tracking links) are accepted from the product file. */
function exactUrl(url: string | undefined): URL | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    return /(^|\.)zooplus\.(nl|be)$/.test(u.hostname) || u.hostname === "www.awin1.com" ? u : null;
  } catch {
    return null;
  }
}

/**
 * Link for the "buy" button: the exact product page when the zooplus product file has this food, otherwise a
 * zooplus search. `exact` tells the button which text to show ("view" or "search").
 */
export function zooplusLink(p: ZooplusTarget & { zooplusUrl?: string }, clickRef: string): { url: string; exact: boolean } {
  const exact = exactUrl(p.zooplusUrl);
  if (!exact) return { url: zooplusAffiliateUrl(p, clickRef), exact: false };
  // an Awin link from the file already carries our publisher id
  if (exact.hostname === "www.awin1.com") return { url: exact.toString(), exact: true };
  return { url: awinWrap(exact.toString(), clickRef), exact: true };
}

function awinWrap(target: string, clickRef: string): string {
  if (!SITE.awin.publisherId || !SITE.awin.zooplusMerchantId) return target;
  const params = new URLSearchParams({
    awinmid: SITE.awin.zooplusMerchantId,
    awinaffid: SITE.awin.publisherId,
    clickref: clickRef.slice(0, 50),
    ued: target,
  });
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}
