"use client";

import { pageview, track } from "@vercel/analytics";
import type { Locale } from "./i18n/config";

/**
 * Searches that find nothing tell the owner which foods to add first. They are reported both as a
 * virtual page view ("/nl/no-results/...") and as a Vercel Pro custom event ("no_results").
 */
const ROUTE = "/[lang]/no-results/[query]";
const sent = new Set<string>();

/** "Kitekat  Kip & Rijst!" -> "kitekat-kip-rijst" (no personal data survives this, and it stays readable). */
export function noResultSlug(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function safeTrack(name: string, data: Record<string, string | number | boolean>) {
  try {
    track(name, data);
  } catch {
    /* analytics must never break the page */
  }
}

export function reportNoResults(lang: Locale, query: string, kind: "search" | "barcode" = "search"): void {
  const slug = noResultSlug(query);
  if (slug.length < 3) return;
  const path = `/${lang}/no-results/${kind === "barcode" ? `barcode-${slug}` : slug}`;
  if (sent.has(path)) return;
  sent.add(path);
  try {
    pageview({ route: ROUTE, path });
  } catch {
    /* analytics must never break the page */
  }
  safeTrack("no_results", { lang, kind, query: slug });
}

export function trackBarcodeScan(lang: Locale, found: boolean, codeOrSlug: string): void {
  safeTrack("barcode_scan", { lang, found, target: codeOrSlug.slice(0, 60) });
}

export function trackShopClick(shop: string, exact: boolean, brand: string, product: string): void {
  safeTrack("shop_click", {
    shop,
    exact,
    brand: brand.slice(0, 40),
    product: product.slice(0, 60),
  });
}

export function trackShareFood(method: "whatsapp" | "copy_link", product: string, score: number | null): void {
  safeTrack("share_food", {
    method,
    product: product.slice(0, 60),
    score: score ?? -1,
  });
}
