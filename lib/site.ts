/**
 * Site-wide settings. Everything an owner may want to change lives here or in environment
 * variables (see .env.example) - never in the page components.
 */
export const SITE = {
  name: "Scanabowl",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.scanabowl.com").replace(/\/$/, ""),
  /** public contact address shown on the site (already used on the live site) */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "scanabowl@gmail.com",
  /** bol.com partner "site id" from the Partner Platform; empty = plain (non-affiliate) links */
  bolSiteId: process.env.NEXT_PUBLIC_BOL_SITE_ID ?? "",
  /** Awin affiliate network: publisher id of Scanabowl and the merchant id of the zooplus NL-BE programme */
  awin: {
    publisherId: process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID ?? "3106869",
    zooplusMerchantId: process.env.NEXT_PUBLIC_AWIN_ZOOPLUS_MID ?? "8139",
  },
  company: {
    kvk: process.env.NEXT_PUBLIC_KVK ?? "",
    vat: process.env.NEXT_PUBLIC_VAT ?? "",
    address: process.env.NEXT_PUBLIC_ADDRESS ?? "",
  },
  /** posts are re-checked for their publish date at most this often (seconds) */
  blogRevalidate: 3600,
} as const;

export const BRAND = {
  green: "#065f46",
  cream: "#faf7f0",
} as const;
