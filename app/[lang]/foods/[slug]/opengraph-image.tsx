import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/data/products";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/t";
import { foodTypeLabel, speciesLabel } from "@/lib/labels";

export const runtime = "nodejs";
export const revalidate = false;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Scanabowl score card";

function scorePalette(score: number | null) {
  if (score === null) return { ring: "#9CA3AF", bg: "#F3F4F6", text: "#4B5563" };
  if (score >= 75) return { ring: "#16A34A", bg: "#DCFCE7", text: "#15803D" };
  if (score >= 50) return { ring: "#D97706", bg: "#FEF3C7", text: "#B45309" };
  return { ring: "#DC2626", bg: "#FEE2E2", text: "#B91C1C" };
}

function gradeLabel(score: number | null, lang: Locale): string {
  if (score === null) return lang === "nl" ? "Geen score" : lang === "de" ? "Keine Bewertung" : lang === "fr" ? "Sans note" : "Not scored";
  if (score >= 85) return lang === "nl" ? "Uitstekend" : lang === "de" ? "Ausgezeichnet" : lang === "fr" ? "Excellent" : "Excellent";
  if (score >= 75) return lang === "nl" ? "Goed" : lang === "de" ? "Gut" : lang === "fr" ? "Bon" : "Good";
  if (score >= 55) return lang === "nl" ? "Gemiddeld" : lang === "de" ? "Mittel" : lang === "fr" ? "Moyen" : "Moderate";
  return lang === "nl" ? "Zwak" : lang === "de" ? "Schwach" : lang === "fr" ? "Faible" : "Poor";
}

function tagline(lang: Locale): string {
  if (lang === "nl") return "Onafhankelijke voerbeoordeling · Gratis";
  if (lang === "de") return "Unabhängige Futterbewertung · Kostenlos";
  if (lang === "fr") return "Évaluation indépendante · Gratuit";
  return "Independent pet food score · Free";
}

export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = isLocale(rawLang) ? rawLang : "nl";
  const p = await getProduct(slug);
  const t = createT(await getDictionary(lang));

  const name = p?.name ?? "Scanabowl";
  const brand = p?.brand ?? "";
  const score = p?.score ?? null;
  const palette = scorePalette(score);
  const label = gradeLabel(score, lang);
  const meta = p ? `${speciesLabel(t, p.species)} · ${foodTypeLabel(t, p.foodType)}` : "";

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
          {/* Top bar */}
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
              <div style={{ fontSize: "30px", fontWeight: 800, color: "#1E4D3B", letterSpacing: "-0.02em" }}>
                Scanabowl
              </div>
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

          {/* Main content */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "44px" }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "14px" }}>
              {brand && (
                <div style={{ fontSize: "26px", fontWeight: 700, color: "#1E4D3B" }}>
                  {brand}
                </div>
              )}
              <div
                style={{
                  fontSize: name.length > 42 ? "44px" : "54px",
                  fontWeight: 800,
                  color: "#1A1A18",
                  lineHeight: 1.12,
                  letterSpacing: "-0.025em",
                }}
              >
                {name.length > 72 ? `${name.slice(0, 69)}…` : name}
              </div>
              {meta && (
                <div style={{ fontSize: "24px", fontWeight: 600, color: "#6F6B63", marginTop: "6px" }}>
                  {meta}
                </div>
              )}
            </div>

            {/* Score Circle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "260px",
                height: "260px",
                borderRadius: "130px",
                background: palette.bg,
                border: `10px solid ${palette.ring}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "92px", fontWeight: 900, color: palette.text, lineHeight: 1 }}>
                  {score !== null ? score : "—"}
                </span>
                {score !== null && (
                  <span style={{ fontSize: "28px", fontWeight: 700, color: palette.text, opacity: 0.75 }}>/100</span>
                )}
              </div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: palette.text, marginTop: "8px" }}>
                {label}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
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
            <div>{tagline(lang)}</div>
            <div style={{ color: "#1E4D3B", fontWeight: 700 }}>FEDIAF · 4.100+ foods</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
