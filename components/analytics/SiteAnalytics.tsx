"use client";

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

export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
