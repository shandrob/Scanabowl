import { NextResponse } from "next/server";
import { dayKey, readDay } from "@/lib/visits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Today's (or ?date=YYYY-MM-DD) visitor numbers, for the owner's own tools only.
 * Needs the secret STATS_KEY in the "x-stats-key" header (or ?key=).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = process.env.STATS_KEY;
  const given = req.headers.get("x-stats-key") ?? url.searchParams.get("key");
  if (!key || key.length < 16 || given !== key) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const date = url.searchParams.get("date");
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dayKey();
  const stats = await readDay(day);
  if (!stats) return NextResponse.json({ error: "counter not set up" }, { status: 503 });
  return NextResponse.json(stats, { headers: { "Cache-Control": "no-store" } });
}
