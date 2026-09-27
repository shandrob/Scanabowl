"use client";

import { pageview } from "@vercel/analytics";
import type { Locale } from "./i18n/config";

/**
 * Searches that find nothing tell the owner which foods to add first. They are reported as a page view of
 * a virtual address, e.g. "/nl/no-results/kitekat-kip" or "/nl/no-results/barcode-8710255123456", so they
 * show up in Vercel Analytics > Pages on every plan (custom events need a paid plan).
 */
const ROUTE = "/[lang]/no-results/[query]";
const sent = new Set<string>();

/** "Kitekat  Kip & Rijst!" -> "kitekat-kip-rijst" (no personal data survives this, and it stays readable). */
export function noResultSlug(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
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
}
