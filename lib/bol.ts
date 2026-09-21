import { SITE } from "./site";

/**
 * bol.com affiliate links.
 *
 * With NEXT_PUBLIC_BOL_SITE_ID set, links go through the bol.com Partner Programme click tracker:
 *   https://partner.bol.com/click/click?p=2&t=url&s=<SITE ID>&f=TXL&url=<target>&name=<link name>&subid=<sub id>
 * Without it, links go straight to bol.com (no commission) so the site keeps working while the
 * partner account is being set up. Check the exact format in your Partner Platform link builder.
 *
 * A product can carry its own bol.com URL ("bol_url" column) - that wins over the EAN search.
 */
export interface BolTarget {
  ean: string;
  name: string;
  bolUrl?: string;
}

export function bolTargetUrl(p: BolTarget): string {
  if (p.bolUrl && /^https:\/\/(www\.)?bol\.com\//i.test(p.bolUrl)) return p.bolUrl;
  const query = p.ean || p.name;
  return `https://www.bol.com/nl/nl/s/?searchtext=${encodeURIComponent(query)}`;
}

export function bolAffiliateUrl(p: BolTarget, subId: string): string {
  const target = bolTargetUrl(p);
  if (!SITE.bolSiteId) return target;
  const params = new URLSearchParams({
    p: "2",
    t: "url",
    s: SITE.bolSiteId,
    f: "TXL",
    url: target,
    name: p.name.slice(0, 100),
    subid: subId,
  });
  return `https://partner.bol.com/click/click?${params.toString()}`;
}
