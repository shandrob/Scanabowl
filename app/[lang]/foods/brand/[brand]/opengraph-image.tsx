import { ImageResponse } from "next/og";
import { getBrand } from "@/lib/data/brands";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const revalidate = false;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Scanabowl brand score card";

function scorePalette(score: number | null) {
  if (score === null) return { ring: "#9CA3AF", bg: "#F3F4F6", text: "#4B5563" };
  if (score >= 75) return { ring: "#16A34A", bg: "#DCFCE7", text: "#15803D" };
  if (score >= 50) return { ring: "#D97706", bg: "#FEF3C7", text: "#B45309" };
  return { ring: "#DC2626", bg: "#FEE2E2", text: "#B91C1C" };
}

function copy(lang: Locale, count: number) {
  if (lang === "nl") {
    return {
      eyebrow: "Merkoverzicht",
      sub: `${count} producten onafhankelijk beoordeeld op het etiket`,
      avg: "Gemiddeld",
      footer: "Vergelijk elk recept gratis op Scanabowl",
    };
  }
  if (lang === "de") {
    return {
      eyebrow: "Markenübersicht",
      sub: `${count} Produkte unabhängig anhand des Etiketts bewertet`,
      avg: "Durchschnitt",
      footer: "Vergleiche jede Sorte kostenlos auf Scanabowl",
    };
  }
  if (lang === "fr") {
    return {
      eyebrow: "Aperçu de la marque",
      sub: `${count} produits évalués en toute indépendance`,
      avg: "Moyenne",
      footer: "Comparez chaque recette gratuitement sur Scanabowl",
    };
  }
  return {
    eyebrow: "Brand overview",
    sub: `${count} products independently scored from the label`,
    avg: "Average",
    footer: "Compare every recipe for free on Scanabowl",
  };
}

export default async function BrandOpenGraphImage({ params }: { params: Promise<{ lang: string; brand: string }> }) {
  const { lang: rawLang, brand: slug } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : "nl";
  const b = await getBrand(slug);

  const name = b?.name ?? "Scanabowl";
  const count = b?.count ?? 0;
  const avg = b?.avg !== null && b?.avg !== undefined ? Math.round(b.avg) : null;
  const palette = scorePalette(avg);
  const c = copy(lang, count);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FAF8F5",
          padding: "44px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#FFFFFF",
            borderRadius: "32px",
            border: "2px solid #E6E2DA",
            padding: "48px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#1E4D3B",
                  color: "#FAF8F5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 800,
                }}
              >
                S
              </div>
              <div style={{ fontSize: "30px", fontWeight: 800, color: "#1E4D3B" }}>Scanabowl</div>
            </div>
            <div
              style={{
                display: "flex",
                background: "#E8F0EC",
                color: "#1E4D3B",
                padding: "10px 22px",
                borderRadius: "999px",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              scanabowl.com
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "44px" }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "14px" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#1E4D3B" }}>{c.eyebrow}</div>
              <div
                style={{
                  fontSize: name.length > 22 ? "54px" : "68px",
                  fontWeight: 800,
                  color: "#1A1A18",
                  lineHeight: 1.08,
                  letterSpacing: "-0.025em",
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: "26px", fontWeight: 600, color: "#52504A", marginTop: "6px" }}>
                {c.sub}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "250px",
                height: "250px",
                borderRadius: "125px",
                background: palette.bg,
                border: `10px solid ${palette.ring}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "88px", fontWeight: 900, color: palette.text, lineHeight: 1 }}>
                  {avg !== null ? avg : "—"}
                </span>
                {avg !== null && (
                  <span style={{ fontSize: "26px", fontWeight: 700, color: palette.text, opacity: 0.75 }}>/100</span>
                )}
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: palette.text, marginTop: "8px" }}>
                {c.avg}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "2px solid #EFECE6",
              paddingTop: "22px",
              fontSize: "22px",
              fontWeight: 600,
              color: "#6F6B63",
            }}
          >
            <div>{c.footer}</div>
            <div style={{ color: "#1E4D3B", fontWeight: 700 }}>100% Independent</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
