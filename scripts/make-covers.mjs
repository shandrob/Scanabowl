/**
 * Draws simple illustrated cover images (1600x900 PNG) in the Scanabowl colours for blog posts that have
 * no photo. Run once with `node scripts/make-covers.mjs`; the PNGs are committed next to the posts
 * (content/blog/<slug>/cover.png) and converted to WebP by the normal data build.
 * No text in the images, so one cover works for every language.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const C = {
  cream: "#faf7f0",
  soft: "#d9eee4",
  tint: "#eef7f2",
  brand: "#065f46",
  mid: "#0b7a57",
  deep: "#04412f",
  amber: "#e2a33b",
  amberSoft: "#fbe7c2",
  red: "#c2410c",
  white: "#ffffff",
  line: "#e6dfd0",
};

const paw = (x, y, s, fill, op = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="${fill}" opacity="${op}">
    <ellipse cx="0" cy="18" rx="22" ry="18"/>
    <ellipse cx="-24" cy="-8" rx="8" ry="11"/>
    <ellipse cx="-8" cy="-20" rx="8" ry="11"/>
    <ellipse cx="8" cy="-20" rx="8" ry="11"/>
    <ellipse cx="24" cy="-8" rx="8" ry="11"/>
  </g>`;

const frame = (art) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="${C.cream}"/>
  <circle cx="1180" cy="470" r="520" fill="${C.tint}"/>
  <circle cx="820" cy="450" r="330" fill="${C.soft}"/>
  ${paw(170, 170, 1.6, C.soft)}
  ${paw(300, 760, 1.2, C.soft)}
  ${paw(1450, 140, 1.1, C.white, 0.9)}
  ${art}
</svg>`;

const bowl = (x, y, s, fill = C.brand) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="-34" cy="-46" r="16" fill="${C.amber}"/>
    <circle cx="0" cy="-58" r="16" fill="${C.amber}"/>
    <circle cx="34" cy="-46" r="16" fill="${C.amber}"/>
    <path d="M-120 -30 H120 C120 50 60 100 0 100 C-60 100 -120 50 -120 -30 Z" fill="${fill}"/>
    <rect x="-130" y="-40" width="260" height="18" rx="9" fill="${C.deep}"/>
  </g>`;

const covers = {
  // label reading: a food bag with a label and a magnifying glass
  "2026-09-21-etiket-lezen": frame(`
    <g transform="translate(820 470)">
      <path d="M-170 -250 H170 L200 250 H-200 Z" fill="${C.white}" stroke="${C.brand}" stroke-width="14" stroke-linejoin="round"/>
      <rect x="-150" y="-280" width="300" height="46" rx="12" fill="${C.brand}"/>
      <rect x="-120" y="-190" width="240" height="120" rx="18" fill="${C.soft}"/>
      ${paw(0, -135, 1.3, C.brand)}
      <rect x="-130" y="-30" width="260" height="16" rx="8" fill="${C.line}"/>
      <rect x="-130" y="10" width="220" height="16" rx="8" fill="${C.line}"/>
      <rect x="-130" y="50" width="250" height="16" rx="8" fill="${C.line}"/>
      <rect x="-130" y="90" width="180" height="16" rx="8" fill="${C.line}"/>
      <rect x="-130" y="130" width="230" height="16" rx="8" fill="${C.line}"/>
    </g>
    <g transform="translate(1030 610) rotate(-35)">
      <rect x="-22" y="120" width="44" height="190" rx="22" fill="${C.deep}"/>
      <circle cx="0" cy="0" r="135" fill="${C.white}" fill-opacity="0.55" stroke="${C.deep}" stroke-width="30"/>
    </g>`),

  // allergy: three ingredients, one struck out, and a protective shield with a paw
  "2026-09-26-voedselallergie-herkennen": frame(`
    <g transform="translate(720 470)">
      <path d="M0 -270 L220 -190 V10 C220 150 110 240 0 290 C-110 240 -220 150 -220 10 V-190 Z" fill="${C.brand}"/>
      <path d="M0 -215 L170 -152 V10 C170 118 88 190 0 232 C-88 190 -170 118 -170 10 V-152 Z" fill="${C.mid}"/>
      ${paw(0, 10, 3, C.white)}
    </g>
    <g transform="translate(1110 250)"><circle r="78" fill="${C.white}" stroke="${C.brand}" stroke-width="12"/><circle r="40" fill="${C.amber}"/></g>
    <g transform="translate(1180 470)"><circle r="78" fill="${C.white}" stroke="${C.brand}" stroke-width="12"/><ellipse rx="46" ry="30" fill="${C.soft}" stroke="${C.mid}" stroke-width="8"/></g>
    <g transform="translate(1110 690)"><circle r="78" fill="${C.white}" stroke="${C.red}" stroke-width="12"/><circle r="38" fill="${C.amberSoft}"/><path d="M-55 -55 L55 55" stroke="${C.red}" stroke-width="16" stroke-linecap="round"/></g>`),

  // complete vs complementary: two tins, one with a check, one with a plus
  "2026-10-05-volledig-of-aanvullend-diervoeder": frame(`
    <g transform="translate(640 500)">
      <rect x="-150" y="-190" width="300" height="360" rx="30" fill="${C.brand}"/>
      <ellipse cx="0" cy="-190" rx="150" ry="40" fill="${C.mid}"/>
      <ellipse cx="0" cy="-190" rx="120" ry="28" fill="${C.deep}"/>
      <rect x="-150" y="-80" width="300" height="140" fill="${C.soft}"/>
      ${paw(0, -10, 1.5, C.brand)}
      <circle cx="120" cy="140" r="78" fill="${C.white}" stroke="${C.brand}" stroke-width="12"/>
      <path d="M82 140 L112 172 L162 110" fill="none" stroke="${C.brand}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(1070 530)">
      <rect x="-120" y="-120" width="240" height="250" rx="26" fill="${C.amber}"/>
      <ellipse cx="0" cy="-120" rx="120" ry="32" fill="#eab35a"/>
      <ellipse cx="0" cy="-120" rx="95" ry="22" fill="#b8801f"/>
      <rect x="-120" y="-30" width="240" height="100" fill="${C.amberSoft}"/>
      <circle cx="95" cy="110" r="66" fill="${C.white}" stroke="${C.amber}" stroke-width="12"/>
      <path d="M95 75 V145 M60 110 H130" stroke="#b8801f" stroke-width="18" stroke-linecap="round"/>
    </g>`),

  // portion: a kitchen scale with a bowl on top
  "2026-10-08-hoeveel-voer-per-dag": frame(`
    <g transform="translate(820 560)">
      <rect x="-260" y="40" width="520" height="190" rx="46" fill="${C.brand}"/>
      <rect x="-230" y="10" width="460" height="46" rx="23" fill="${C.deep}"/>
      <circle cx="0" cy="140" r="72" fill="${C.white}"/>
      <path d="M0 140 L40 92" stroke="${C.red}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="0" cy="140" r="12" fill="${C.deep}"/>
      <path d="M-50 140 A50 50 0 0 1 50 140" fill="none" stroke="${C.soft}" stroke-width="8"/>
    </g>
    ${bowl(820, 430, 1.55)}`),

  // grain-free: a wheat ear and a pea pod, balanced
  "2026-10-12-graanvrij-voer-beter": frame(`
    <g transform="translate(820 470)">
      <path d="M0 -250 V250" stroke="${C.deep}" stroke-width="18" stroke-linecap="round"/>
      <path d="M-330 -120 H330" stroke="${C.deep}" stroke-width="18" stroke-linecap="round"/>
      <path d="M-120 250 H120" stroke="${C.deep}" stroke-width="22" stroke-linecap="round"/>
      <circle cx="0" cy="-250" r="22" fill="${C.deep}"/>
      <path d="M-330 -120 L-420 60 H-240 Z" fill="none" stroke="${C.deep}" stroke-width="8"/>
      <path d="M330 -120 L240 60 H420 Z" fill="none" stroke="${C.deep}" stroke-width="8"/>
      <path d="M-440 60 H-220 C-220 110 -270 140 -330 140 C-390 140 -440 110 -440 60 Z" fill="${C.brand}"/>
      <path d="M220 60 H440 C440 110 390 140 330 140 C270 140 220 110 220 60 Z" fill="${C.brand}"/>
      <g transform="translate(-330 30) scale(0.72)">
        <path d="M0 70 V-150" stroke="#b8801f" stroke-width="10" stroke-linecap="round"/>
        ${[-120, -85, -50, -15, 20].map((y) => `<ellipse cx="-20" cy="${y}" rx="14" ry="26" transform="rotate(-25 -20 ${y})" fill="${C.amber}"/><ellipse cx="20" cy="${y}" rx="14" ry="26" transform="rotate(25 20 ${y})" fill="${C.amber}"/>`).join("")}
        <ellipse cx="0" cy="-160" rx="12" ry="24" fill="${C.amber}"/>
      </g>
      <g transform="translate(330 20) rotate(-20)">
        <path d="M-120 0 C-80 -70 80 -70 120 0 C80 50 -80 50 -120 0 Z" fill="${C.mid}"/>
        ${[-70, -25, 20, 65].map((x) => `<circle cx="${x}" cy="-4" r="22" fill="#7cc79c"/>`).join("")}
      </g>
    </g>`),
};

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "content", "blog");
for (const [slug, svg] of Object.entries(covers)) {
  const dir = path.join(root, slug);
  if (!fs.existsSync(dir)) {
    console.warn("skip (no post folder):", slug);
    continue;
  }
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(dir, "cover.png"));
  console.log("cover:", slug);
}
