import { NextResponse } from "next/server";
import { parseSubmission, subject, toHtml, toText } from "@/lib/submissions";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Receives the suggestion / brand / report / contact forms and e-mails them to the owner.
 * Needs RESEND_API_KEY (https://resend.com). Without it the API answers "not_configured" and the
 * form falls back to a mailto: link, so visitors are never left with a dead end.
 */

// best-effort in-memory rate limit (per server instance)
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 3600_000 });
    return false;
  }
  h.n += 1;
  return h.n > 8;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  // bots fill the hidden field or submit within a second of loading the page
  if (typeof b.website === "string" && b.website.trim() !== "") return NextResponse.json({ ok: true });
  const loaded = Number(b.ts);
  if (Number.isFinite(loaded) && Date.now() - loaded < 2500) return NextResponse.json({ ok: false, error: "too_fast" }, { status: 429 });

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  const parsed = parseSubmission(body);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: "invalid", fields: parsed.errors }, { status: 422 });

  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  const s = parsed.data;
  const to = process.env.MAIL_TO || SITE.email;
  const from = process.env.MAIL_FROM || "Scanabowl <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        ...(s.email ? { reply_to: s.email } : {}),
        subject: subject(s),
        text: toText(s),
        html: toHtml(s),
      }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
    }
  } catch (e) {
    console.error("Resend request failed", e);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
