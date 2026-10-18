import { createHash } from "node:crypto";

/**
 * A small visitor counter of our own, so the numbers can be read by other programs (the owner's
 * desk device sends them to his phone every night). Vercel Web Analytics stays as it is.
 *
 * Privacy: no cookies and nothing stored per person. A visitor is a hash of the day, the IP address,
 * the browser and a secret; the hash only goes into a HyperLogLog (a counting sketch that cannot be
 * turned back into hashes), and every day starts with a new set. All keys expire after 40 days.
 *
 * Storage: Upstash Redis through its REST API (added in Vercel -> Storage). Without its variables the
 * counter silently does nothing.
 */

const KEEP_SECONDS = 40 * 24 * 3600;

/** The day in the Netherlands, e.g. "2026-10-18": "today" means the owner's today. */
export function dayKey(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

const BOTS = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|pingdom|curl|wget|python|axios|httpclient|java\/|go-http|node-fetch|facebookexternalhit|whatsapp|telegram/i;

/** Robots, link previews and scripts are not visitors. */
export function isBot(userAgent: string | null): boolean {
  return !userAgent || userAgent.length < 20 || BOTS.test(userAgent);
}

/** "/nl/foods/brit-care-kat?x=1" -> "/nl/foods/brit-care-kat"; anything odd -> null. */
export function cleanPath(path: unknown): string | null {
  if (typeof path !== "string" || !path.startsWith("/")) return null;
  const p = path.split(/[?#]/)[0].slice(0, 160);
  if (p.includes("/no-results/") || p.startsWith("/api/")) return null;
  return p;
}

export function visitorHash(day: string, ip: string, userAgent: string, secret: string): string {
  return createHash("sha256").update(`${day}|${ip}|${userAgent}|${secret}`).digest("base64url").slice(0, 22);
}

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export function countingEnabled(): boolean {
  return redisConfig() !== null;
}

/** Runs several Redis commands in one request. Returns their results, or null when it could not. */
export async function redis(commands: (string | number)[][]): Promise<unknown[] | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const out = (await res.json()) as { result?: unknown }[];
    return out.map((r) => r.result ?? null);
  } catch {
    return null;
  }
}

export async function recordVisit(path: string, ip: string, userAgent: string, secret: string, at = new Date()): Promise<void> {
  const day = dayKey(at);
  await redis([
    ["PFADD", `v:${day}:visitors`, visitorHash(day, ip, userAgent, secret)],
    ["INCR", `v:${day}:views`],
    ["ZINCRBY", `v:${day}:pages`, 1, path],
    ["EXPIRE", `v:${day}:visitors`, KEEP_SECONDS],
    ["EXPIRE", `v:${day}:views`, KEEP_SECONDS],
    ["EXPIRE", `v:${day}:pages`, KEEP_SECONDS],
  ]);
}

export interface DayStats {
  date: string;
  visitors: number;
  views: number;
  top: { path: string; views: number }[];
}

export async function readDay(day: string, topCount = 5): Promise<DayStats | null> {
  const out = await redis([
    ["PFCOUNT", `v:${day}:visitors`],
    ["GET", `v:${day}:views`],
    ["ZREVRANGE", `v:${day}:pages`, 0, topCount - 1, "WITHSCORES"],
  ]);
  if (!out) return null;
  const pairs = (out[2] as string[] | null) ?? [];
  const top: DayStats["top"] = [];
  for (let i = 0; i + 1 < pairs.length; i += 2) top.push({ path: pairs[i], views: Number(pairs[i + 1]) });
  return { date: day, visitors: Number(out[0] ?? 0), views: Number(out[1] ?? 0), top };
}
