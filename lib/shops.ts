import { bolAffiliateUrl } from "./bol";
import type { Locale } from "./i18n/config";
import { SITE } from "./site";
import { zooplusLink, zooplusSearchQuery } from "./zooplus";

export interface ShopLink {
  id: "zooplus" | "brekz" | "bol" | "amazon";
  label: string;
  url: string;
  exact?: boolean;
}

export interface ShopTarget {
  ean: string;
  name: string;
  brand: string;
  bolUrl?: string;
  zooplusUrl?: string;
}

const BREKZ_DOMAIN: Record<Locale, string> = {
  nl: "https://www.brekz.nl",
  en: "https://www.brekz.nl",
  de: "https://www.brekz.de",
  fr: "https://www.brekz.fr",
};

const AMAZON_DOMAIN: Record<Locale, string> = {
  nl: "https://www.amazon.nl",
  en: "https://www.amazon.nl",
  de: "https://www.amazon.de",
  fr: "https://www.amazon.fr",
};

function brekzUrl(p: ShopTarget, lang: Locale, clickRef: string): string {
  const q = encodeURIComponent(zooplusSearchQuery(p));
  const target = `${BREKZ_DOMAIN[lang]}/search?controller=search&s=${q}`;
  if (!SITE.awin.publisherId || !SITE.awin.brekzMerchantId) return target;
  const params = new URLSearchParams({
    awinmid: SITE.awin.brekzMerchantId,
    awinaffid: SITE.awin.publisherId,
    clickref: clickRef.slice(0, 50),
    ued: target,
  });
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

function amazonUrl(p: ShopTarget, lang: Locale): string {
  const q = encodeURIComponent(p.ean || zooplusSearchQuery(p));
  const u = new URL(`${AMAZON_DOMAIN[lang]}/s`);
  u.searchParams.set("k", decodeURIComponent(q));
  if (SITE.amazonTag) u.searchParams.set("tag", SITE.amazonTag);
  return u.toString();
}

/**
 * Multi-shop price comparison links for a product page, buying guide, or comparison table.
 * All links automatically upgrade to affiliate links when partner IDs are configured in env,
 * and otherwise link directly to the shop search or exact product page.
 */
export function shopLinks(p: ShopTarget, lang: Locale, clickRef: string): ShopLink[] {
  const zp = zooplusLink({ brand: p.brand, name: p.name, zooplusUrl: p.zooplusUrl }, clickRef);
  const links: ShopLink[] = [
    {
      id: "zooplus",
      label: "zooplus",
      url:
        lang === "de" && !zp.exact
          ? `https://www.zooplus.de/search/results?q=${encodeURIComponent(zooplusSearchQuery(p))}`
          : lang === "fr" && !zp.exact
            ? `https://www.zooplus.fr/search/results?q=${encodeURIComponent(zooplusSearchQuery(p))}`
            : zp.url,
      exact: zp.exact,
    },
    {
      id: "brekz",
      label: "Brekz",
      url: brekzUrl(p, lang, clickRef),
    },
  ];

  if (lang === "nl" || lang === "en" || p.bolUrl) {
    links.push({
      id: "bol",
      label: "bol.com",
      url: bolAffiliateUrl({ ean: p.ean, name: p.name, bolUrl: p.bolUrl }, clickRef),
    });
  }

  links.push({
    id: "amazon",
    label: lang === "de" ? "Amazon.de" : lang === "fr" ? "Amazon.fr" : "Amazon.nl",
    url: amazonUrl(p, lang),
  });

  return links;
}
