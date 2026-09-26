import { stringify } from "csv-stringify/sync";
import { MASTER_COLUMNS } from "./catalog/csv";

/**
 * Validation + formatting of everything visitors send in. Kept free of I/O so it can be tested.
 * Nothing submitted is ever published automatically: it arrives in the owner's inbox as a
 * ready-to-paste database row, and only appears on the site after the owner has reviewed it.
 */

export type SubmissionKind = "product" | "brand" | "report" | "contact";

export interface ProductSubmission {
  name: string;
  brand: string;
  species: "dog" | "cat";
  foodType: "dry" | "wet" | "frozen" | "other";
  lifeStage: "young" | "adult" | "senior" | "all";
  ean: string;
  ingredients: string;
  analysis: string;
  pack: string;
  url: string;
}

export interface Submission {
  kind: SubmissionKind;
  lang: string;
  email: string;
  message: string;
  /** brand submissions */
  company?: { name: string; contact: string; role: string; website: string; phone: string };
  products: ProductSubmission[];
  /** report submissions */
  reportRef?: string;
  reportName?: string;
  /** photos of the pack (product suggestions and reports), sent to the owner as e-mail attachments */
  photos?: PhotoAttachment[];
  /** the visitor allows Scanabowl to use the front photo as the product photo */
  photoPermission?: boolean;
}

export interface PhotoAttachment {
  filename: string;
  /** base64, no "data:" prefix */
  content: string;
}

export const MAX_PHOTOS = 4;
/** base64 characters per photo (~700 KB) and in total; keeps the request under the host's 4.5 MB limit */
const MAX_PHOTO_CHARS = 950_000;
const MAX_PHOTOS_TOTAL_CHARS = 3_800_000;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

function cleanPhotos(raw: unknown): { photos: PhotoAttachment[]; ok: boolean } {
  if (raw === undefined || raw === null) return { photos: [], ok: true };
  if (!Array.isArray(raw) || raw.length > MAX_PHOTOS) return { photos: [], ok: false };
  const photos: PhotoAttachment[] = [];
  let total = 0;
  for (const [i, item] of raw.entries()) {
    const r = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const type = typeof r.type === "string" ? r.type : "";
    const data = typeof r.data === "string" ? r.data : "";
    if (!/^image\/(jpeg|png|webp)$/.test(type) || !data || data.length > MAX_PHOTO_CHARS || !BASE64_RE.test(data)) return { photos: [], ok: false };
    total += data.length;
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const base = (typeof r.name === "string" ? r.name : "").replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 40) || "foto";
    photos.push({ filename: `${i + 1}-${base}.${ext}`, content: data });
  }
  return total > MAX_PHOTOS_TOTAL_CHARS ? { photos: [], ok: false } : { photos, ok: true };
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? stripControl(v).trim().slice(0, max) : "");
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : fallback);

function stripControl(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 32 || c === 9 || c === 10) out += ch;
  }
  return out;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanProduct(raw: unknown): ProductSubmission | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const p: ProductSubmission = {
    name: clip(r.name, 160),
    brand: clip(r.brand, 80),
    species: oneOf(r.species, ["dog", "cat"] as const, "dog"),
    foodType: oneOf(r.foodType, ["dry", "wet", "frozen", "other"] as const, "dry"),
    lifeStage: oneOf(r.lifeStage, ["young", "adult", "senior", "all"] as const, "adult"),
    ean: clip(r.ean, 20).replace(/[^\d]/g, ""),
    ingredients: clip(r.ingredients, 4000),
    analysis: clip(r.analysis, 1500),
    pack: clip(r.pack, 60),
    url: clip(r.url, 300),
  };
  return p.name || p.ingredients ? p : null;
}

export type ValidationError = { field: string; code: "required" | "invalid" };

export function parseSubmission(body: unknown): { ok: true; data: Submission } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const kind = oneOf(b.kind, ["product", "brand", "report", "contact"] as const, "contact");
  const email = clip(b.email, 120);
  const message = clip(b.message, 3000);
  const products = (Array.isArray(b.products) ? b.products : []).slice(0, 12).map(cleanProduct).filter((p): p is ProductSubmission => !!p);

  if (email && !EMAIL_RE.test(email)) errors.push({ field: "email", code: "invalid" });

  const data: Submission = { kind, lang: clip(b.lang, 5) || "nl", email, message, products };

  if (kind === "product") {
    if (!products.length) errors.push({ field: "name", code: "required" });
    else {
      if (!products[0].name) errors.push({ field: "name", code: "required" });
      if (!products[0].brand) errors.push({ field: "brand", code: "required" });
    }
    if (b.consent !== true && email) errors.push({ field: "consent", code: "required" });
  }
  if (kind === "brand") {
    const c = (b.company && typeof b.company === "object" ? b.company : {}) as Record<string, unknown>;
    data.company = { name: clip(c.name, 120), contact: clip(c.contact, 120), role: clip(c.role, 80), website: clip(c.website, 200), phone: clip(c.phone, 40) };
    if (!data.company.name) errors.push({ field: "companyName", code: "required" });
    if (!data.company.contact) errors.push({ field: "contact", code: "required" });
    if (!email) errors.push({ field: "email", code: "required" });
    if (!data.company.website) errors.push({ field: "website", code: "required" });
    if (!products.length) errors.push({ field: "name", code: "required" });
    else if (products.some((p) => !p.name || !p.ingredients)) errors.push({ field: "ingredients", code: "required" });
    if (b.authorised !== true) errors.push({ field: "authorised", code: "required" });
    if (b.consent !== true) errors.push({ field: "consent", code: "required" });
  }
  if (kind === "product" || kind === "report") {
    const { photos, ok } = cleanPhotos(b.photos);
    if (!ok) errors.push({ field: "photos", code: "invalid" });
    if (photos.length) {
      data.photos = photos;
      data.photoPermission = b.photoPermission === true;
    }
  }
  if (kind === "report") {
    data.reportRef = clip(b.reportRef, 60);
    data.reportName = clip(b.reportName, 160);
    if (message.length < 5) errors.push({ field: "message", code: "required" });
  }
  if (kind === "contact") {
    if (message.length < 5) errors.push({ field: "message", code: "required" });
    if (!email) errors.push({ field: "email", code: "required" });
    if (b.consent !== true) errors.push({ field: "consent", code: "required" });
  }
  return errors.length ? { ok: false, errors } : { ok: true, data };
}

const SPECIES_NL = { dog: "Hond", cat: "Kat" } as const;
const TYPE_NL = { dry: "Droogvoer", wet: "Natvoer", frozen: "Diepvriesvoer", other: "Overig" } as const;
const STAGE_NL = { young: "Jong (puppy/kitten)", adult: "Volwassen", senior: "Senior", all: "Alle leeftijden" } as const;

/** One CSV line per product in the master-database format, ready to paste into database/manual/*.csv */
export function toCsvRows(s: Submission): string {
  const source = s.kind === "brand" ? "brand" : "user";
  const rows = s.products.map((p) => ({
    ean: p.ean,
    naam: p.name,
    merk: p.brand || s.company?.name || "",
    doeldier: SPECIES_NL[p.species],
    voertype: TYPE_NL[p.foodType],
    levensfase: STAGE_NL[p.lifeStage],
    categorie: "Volledig",
    ingredienten: p.ingredients,
    analyse: p.analysis,
    verpakking: p.pack,
    prijs: "",
    bol_url: "",
    afbeelding: "",
    bron: source,
    url: p.url,
    opmerking: s.kind === "brand" ? `Ingezonden door ${s.company?.name ?? ""} (${s.email}) - nog controleren` : "Ingezonden door bezoeker - nog controleren",
  }));
  return stringify(rows, { columns: MASTER_COLUMNS, delimiter: ";", quoted_string: true });
}

export const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export function subject(s: Submission): string {
  switch (s.kind) {
    case "product":
      return `[Scanabowl] Productsuggestie: ${s.products[0]?.brand ?? ""} ${s.products[0]?.name ?? ""}`.trim();
    case "brand":
      return `[Scanabowl] MERK-inzending: ${s.company?.name ?? ""} (${s.products.length} product${s.products.length === 1 ? "" : "en"})`;
    case "report":
      return `[Scanabowl] Foutmelding: ${s.reportName ?? s.reportRef ?? ""}`;
    default:
      return "[Scanabowl] Bericht via contactformulier";
  }
}

export function toText(s: Submission): string {
  const L: string[] = [];
  L.push(`Type: ${s.kind}   Taal: ${s.lang}`);
  if (s.email) L.push(`E-mail: ${s.email}`);
  if (s.company) {
    L.push("", "== BEDRIJF ==", `Naam: ${s.company.name}`, `Contactpersoon: ${s.company.contact}${s.company.role ? ` (${s.company.role})` : ""}`, `Website: ${s.company.website}`, `Telefoon: ${s.company.phone || "-"}`);
  }
  if (s.reportRef) L.push("", `Betreft product: ${s.reportName ?? ""} (${s.reportRef})`);
  if (s.message) L.push("", "== BERICHT ==", s.message);
  s.products.forEach((p, i) => {
    L.push("", `== PRODUCT ${i + 1} ==`, `Naam: ${p.name}`, `Merk: ${p.brand}`, `Dier: ${p.species}  Type: ${p.foodType}  Levensfase: ${p.lifeStage}`, `EAN: ${p.ean || "-"}  Verpakking: ${p.pack || "-"}`, `Link: ${p.url || "-"}`, "", "Ingrediënten:", p.ingredients || "-", "", "Analytische bestanddelen:", p.analysis || "-");
  });
  if (s.photos?.length) {
    L.push(
      "",
      `== FOTO'S ==`,
      `${s.photos.length} foto${s.photos.length === 1 ? "" : "'s"} van de verpakking bijgevoegd.`,
      s.photoPermission
        ? "Toestemming: de voorkantfoto mag als productfoto op Scanabowl (opslaan als database/images/<EAN>.jpg)."
        : "Geen toestemming om de foto's op de site te gebruiken - alleen om de gegevens over te nemen.",
    );
  }
  if (s.products.length) L.push("", "== REGELS VOOR DE DATABASE (plak in database/manual/*.csv) ==", toCsvRows(s));
  return L.join("\n");
}

export function toHtml(s: Submission): string {
  const pre = esc(toText(s));
  return `<div style="font-family:system-ui,sans-serif;max-width:720px"><h2 style="color:#065f46">${esc(subject(s))}</h2><pre style="white-space:pre-wrap;font:14px/1.5 ui-monospace,monospace;background:#faf7f0;padding:16px;border-radius:12px">${pre}</pre><p style="color:#64748b;font-size:12px">Niets hiervan is gepubliceerd. Controleer de gegevens en voeg ze toe aan de database.</p></div>`;
}
