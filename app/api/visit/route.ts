import { cleanPath, countingEnabled, isBot, recordVisit } from "@/lib/visits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One page view, sent by the browser (components/analytics/SiteAnalytics.tsx). Always answers 204. */
export async function POST(req: Request) {
  const done = new Response(null, { status: 204 });
  if (!countingEnabled()) return done;
  const ua = req.headers.get("user-agent");
  if (isBot(ua)) return done;
  let path: string | null = null;
  try {
    path = cleanPath(((await req.json()) as { p?: unknown }).p);
  } catch {
    return done;
  }
  if (!path) return done;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const secret = process.env.STATS_SALT ?? process.env.STATS_KEY ?? "scanabowl";
  await recordVisit(path, ip, ua ?? "", secret);
  return done;
}
