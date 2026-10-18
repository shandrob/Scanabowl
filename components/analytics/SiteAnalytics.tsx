"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics: page views without cookies (visitors are counted by an anonymous hash that is
 * discarded after 24 hours). The owner switches it on in Vercel -> Project -> Analytics.
 *
 * Query strings are dropped before sending: a search typed in the finder is nobody's business
 * except for searches that found nothing, which lib/analytics.ts reports on purpose.
 */
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const at = event.url.indexOf("?");
  return at === -1 ? event : { ...event, url: event.url.slice(0, at) };
}

/** Our own small visitor counter (lib/visits.ts): one beacon per page shown, no cookies. */
function useVisitCounter() {
  const path = usePathname();
  useEffect(() => {
    if (!path) return;
    try {
      const body = JSON.stringify({ p: path });
      if (!navigator.sendBeacon?.("/api/visit", new Blob([body], { type: "application/json" }))) {
        fetch("/api/visit", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } catch {
      /* counting must never break the page */
    }
  }, [path]);
}

export function SiteAnalytics() {
  useVisitCounter();
  return <Analytics beforeSend={beforeSend} />;
}
