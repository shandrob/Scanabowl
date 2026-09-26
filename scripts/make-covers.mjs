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


const heart = (x, y, s, fill) => `
  <path transform="translate(${x} ${y}) scale(${s})" fill="${fill}"
    d="M0 70 C-70 25 -130 -20 -130 -75 C-130 -125 -80 -150 -40 -135 C-15 -125 0 -105 0 -95 C0 -105 15 -125 40 -135 C80 -150 130 -125 130 -75 C130 -20 70 25 0 70 Z"/>`;

const catShape = (x, y, s, fill) => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    <path d="M100 150 C215 150 235 30 165 -5" fill="none" stroke="${fill}" stroke-width="30" stroke-linecap="round"/>
    <ellipse cx="0" cy="60" rx="110" ry="130"/>
    <circle cx="0" cy="-110" r="80"/>
    <path d="M-72 -148 L-62 -232 L-12 -182 Z"/>
    <path d="M72 -148 L62 -232 L12 -182 Z"/>
    <ellipse cx="-28" cy="-115" rx="10" ry="15" fill="${C.cream}"/>
    <ellipse cx="28" cy="-115" rx="10" ry="15" fill="${C.cream}"/>
  </g>`;

const snowflake = (x, y, s, stroke) => `
  <g transform="translate(${x} ${y}) scale(${s})" stroke="${stroke}" stroke-width="12" stroke-linecap="round" fill="none">
    ${[0, 60, 120].map((a) => `<g transform="rotate(${a})"><path d="M0 -90 V90"/><path d="M-22 -68 L0 -48 L22 -68"/><path d="M-22 68 L0 48 L22 68"/></g>`).join("")}
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

  // animal derivatives: organ, drumstick and a question-mark tag ("which animal?")
  "2026-10-15-dierlijke-bijproducten": frame(`
    ${heart(700, 470, 1.35, C.red)}
    <path d="M700 380 C700 330 730 300 760 290" fill="none" stroke="${C.cream}" stroke-width="10" stroke-linecap="round" opacity="0.6"/>
    <g transform="translate(1010 420) rotate(35)">
      <ellipse cx="0" cy="-60" rx="95" ry="120" fill="${C.amber}"/>
      <rect x="-20" y="40" width="40" height="150" rx="20" fill="${C.white}" stroke="${C.line}" stroke-width="6"/>
      <circle cx="-26" cy="200" r="26" fill="${C.white}" stroke="${C.line}" stroke-width="6"/>
      <circle cx="26" cy="200" r="26" fill="${C.white}" stroke="${C.line}" stroke-width="6"/>
    </g>
    <g transform="translate(1060 690)">
      <path d="M-110 -60 H70 L120 0 L70 60 H-110 Z" fill="${C.white}" stroke="${C.brand}" stroke-width="12" stroke-linejoin="round"/>
      <circle cx="70" cy="0" r="12" fill="${C.brand}"/>
      <text x="-25" y="30" font-family="Georgia, serif" font-size="96" font-weight="700" fill="${C.brand}" text-anchor="middle">?</text>
    </g>`),

  // puppy food: a small and a big bowl with a growth curve
  "2026-10-19-puppyvoer-groot-klein-ras": frame(`
    <path d="M500 640 C650 620 800 520 900 380 C960 300 1040 240 1150 220" fill="none" stroke="${C.brand}" stroke-width="12" stroke-dasharray="4 28" stroke-linecap="round"/>
    <path d="M1150 220 l-60 -18 m60 18 l-42 46" fill="none" stroke="${C.brand}" stroke-width="14" stroke-linecap="round"/>
    ${bowl(600, 690, 0.8)}
    ${bowl(1040, 640, 1.45)}
    ${paw(560, 470, 0.9, C.mid)}
    ${paw(1180, 420, 1.6, C.mid)}`),

  // neutered cat: a sitting cat next to a small, measured portion
  "2026-10-22-gesteriliseerde-kat-voeding": frame(`
    ${catShape(700, 470, 1.2, C.brand)}
    ${bowl(1080, 650, 1.05)}
    <g transform="translate(1150 470)">
      <circle r="78" fill="${C.white}" stroke="${C.amber}" stroke-width="12"/>
      <path d="M-40 0 H40" stroke="#b8801f" stroke-width="20" stroke-linecap="round"/>
    </g>`),

  // raw food: a steak on a cutting board, frozen
  "2026-10-26-rauw-voer-barf": frame(`
    <g transform="translate(800 520)">
      <rect x="-330" y="-190" width="600" height="380" rx="60" fill="#d8b384"/>
      <rect x="-310" y="-170" width="560" height="340" rx="46" fill="#e6c79c"/>
      <rect x="270" y="-40" width="90" height="80" rx="30" fill="#d8b384"/>
      <circle cx="315" cy="0" r="16" fill="${C.tint}"/>
      <path d="M-230 -30 C-220 -120 0 -140 110 -80 C190 -35 170 80 60 110 C-60 140 -240 70 -230 -30 Z" fill="#c2504a"/>
      <path d="M-170 -20 C-100 -60 20 -70 90 -30" fill="none" stroke="#f3d6cf" stroke-width="14" stroke-linecap="round"/>
      <path d="M-150 50 C-80 30 0 40 60 70" fill="none" stroke="#f3d6cf" stroke-width="10" stroke-linecap="round"/>
    </g>
    ${snowflake(1150, 280, 1.2, C.mid)}`),

  // senior: a clock with a paw and a food bowl
  "2026-10-29-senior-hond-kat-voeding": frame(`
    <g transform="translate(760 440)">
      <circle r="230" fill="${C.white}" stroke="${C.brand}" stroke-width="22"/>
      ${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30})" d="M0 -200 V-172" stroke="${C.deep}" stroke-width="${i % 3 === 0 ? 14 : 8}" stroke-linecap="round"/>`).join("")}
      <path d="M0 0 L-70 -90" stroke="${C.deep}" stroke-width="18" stroke-linecap="round"/>
      <path d="M0 0 L110 -60" stroke="${C.deep}" stroke-width="12" stroke-linecap="round"/>
      <circle r="18" fill="${C.deep}"/>
      ${paw(0, 110, 1.1, C.soft)}
    </g>
    ${bowl(1150, 680, 1.0)}`),

  // taurine: a heart with a heartbeat line, and a cat
  "2026-11-02-taurine-kat": frame(`
    ${heart(760, 470, 1.9, C.brand)}
    <path d="M540 400 H660 L700 330 L750 480 L800 360 L830 400 H980" fill="none" stroke="${C.white}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    ${catShape(1160, 560, 0.75, C.amber)}`),
};

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "content", "blog");
for (const [slug, svg] of Object.entries(covers)) {
  const dir = path.join(root, slug);
  if (!fs.existsSync(dir)) {
    console.warn("skip (no post folder):", slug);
    continue;
  }
  const file = path.join(dir, "cover.png");
  // never overwrite an existing cover (it may be a real photo); use --force to redraw
  if (fs.existsSync(file) && !process.argv.includes("--force")) continue;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
  console.log("cover:", slug);
}
