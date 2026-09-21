import { NextResponse } from "next/server";
import { normalizeEan } from "@/lib/catalog/clean";
import eanMap from "@/data/generated/ean.json";

/** Barcode -> product page. Accepts EAN-13, EAN-8 and 12-digit UPC-A codes. */
export async function GET(_req: Request, { params }: { params: Promise<{ ean: string }> }) {
  const { ean } = await params;
  const key = normalizeEan(ean);
  const slug = key ? (eanMap as Record<string, string>)[key] : undefined;
  if (!slug) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ slug }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
