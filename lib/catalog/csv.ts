import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

/**
 * Tolerant CSV reader: handles ; or , delimiters (Dutch Excel saves with ;), a UTF-8 BOM,
 * quoted multi-line cells and header names in any case.
 */
export function readCsv(file: string): Record<string, string>[] {
  let text = fs.readFileSync(file, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows = parse(text, {
    columns: (header: string[]) => header.map((h) => h.trim().toLowerCase().replace(/^'/, "")),
    delimiter,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: false,
    bom: true,
    quote: '"',
  }) as Record<string, string>[];
  return rows;
}

/** Excel-friendly output: semicolon delimiter + BOM so Dutch Excel opens it with columns. */
export function writeCsv(file: string, rows: Array<Record<string, string | number | undefined>>, columns: string[]): void {
  const out = stringify(rows, { header: true, columns, delimiter: ";", quoted_string: true });
  fs.writeFileSync(file, "﻿" + out, "utf8");
}

const ALIASES: Record<string, string[]> = {
  ean: ["ean", "barcode", "gtin", "ean-code", "eancode", "ean13", "product_gtin"],
  name: ["naam", "name", "product", "productnaam", "product name", "titel", "title"],
  brand: ["merk", "brand", "brand_name", "merknaam"],
  species: ["doeldier", "species", "dier", "animal", "soort dier", "target animal"],
  foodType: ["voertype", "type", "foodtype", "food type", "voedingstype", "soort voer"],
  lifeStage: ["levensfase", "lifestage", "life stage", "leeftijd", "fase", "age"],
  category: ["categorie", "category"],
  ingredients: ["ingredienten", "ingrediënten", "ingredients", "samenstelling", "composition", "zutaten"],
  analysis: ["analyse", "analysis", "analytische bestanddelen", "analytical constituents", "analytische componenten"],
  pack: ["verpakking", "pack", "size", "inhoud", "gewicht", "weight", "pack size"],
  price: ["prijs", "price", "adviesprijs", "consumentenprijs", "rrp"],
  bolUrl: ["bol_url", "bol", "bolurl", "bol.com", "bol-link"],
  zooplusUrl: ["zooplus_url", "zooplus", "zooplus-link"],
  image: ["afbeelding", "image", "foto", "image_url", "afbeelding_url", "photo", "photo_url"],
  source: ["bron", "source"],
  url: ["url", "link", "bronlink", "product_url", "website"],
  notes: ["opmerking", "notes", "notitie"],
  status: ["status"],
};

const NUTRIENT_COLUMNS: Array<{ label: string; unit: string; keys: string[] }> = [
  { label: "Ruw eiwit", unit: "%", keys: ["ruw eiwit", "eiwit", "eiwit %", "ruw eiwit %", "protein", "crude protein", "protein %", "rohprotein"] },
  { label: "ruw vet", unit: "%", keys: ["ruw vet", "vet", "vet %", "ruw vet %", "vetgehalte", "fat", "crude fat", "fat %", "rohfett"] },
  { label: "ruwe celstof", unit: "%", keys: ["ruwe celstof", "celstof", "vezels", "ruwe vezels", "celstof %", "fibre", "crude fibre", "crude fiber", "fiber", "rohfaser"] },
  { label: "ruwe as", unit: "%", keys: ["ruwe as", "as", "as %", "ruwe as %", "anorganische stof", "ash", "crude ash", "rohasche"] },
  { label: "vocht", unit: "%", keys: ["vocht", "vocht %", "vochtgehalte", "moisture", "moisture %", "feuchtigkeit"] },
  { label: "calcium", unit: "%", keys: ["calcium", "calcium %", "ca", "ca %"] },
  { label: "fosfor", unit: "%", keys: ["fosfor", "fosfor %", "phosphorus", "phosphorus %", "p", "p %"] },
  { label: "energie", unit: "kcal/100g", keys: ["kcal_100g", "kcal/100g", "kcal per 100g", "kcal/100 g", "kcal", "energie (kcal/100g)", "energy (kcal/100g)"] },
  { label: "energie", unit: "kcal/kg", keys: ["kcal_kg", "kcal/kg", "kcal per kg", "energie (kcal/kg)", "energy (kcal/kg)", "metaboliseerbare energie"] },
];

export type Field = keyof typeof ALIASES;

export function field(row: Record<string, string>, f: Field): string {
  for (const key of ALIASES[f]) {
    const v = row[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

/**
 * When a brand sends a CSV with separate columns for protein, fat, ash, fibre, moisture, calcium, phosphorus or kcal
 * instead of a combined `analyse` column, assemble them into a standard analytical-constituents string.
 */
export function assembleAnalysis(row: Record<string, string>): string {
  const direct = field(row, "analysis");
  const parts: string[] = [];
  for (const col of NUTRIENT_COLUMNS) {
    let val = "";
    for (const k of col.keys) {
      const v = row[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        val = String(v).trim();
        break;
      }
    }
    if (!val) continue;
    const num = val.replace(/\s*(%|kcal\/100\s*g|kcal\/kg|kcal)\s*$/i, "").trim();
    if (!/\d/.test(num)) continue;
    parts.push(col.unit === "%" ? `${col.label} ${num}%` : `${num} ${col.unit}`);
  }
  if (!parts.length) return direct;
  if (!direct) return parts.join(", ");
  return `${direct}, ${parts.join(", ")}`;
}

/** Column order of the master database (Dutch headers, as in the original scraper). */
export const MASTER_COLUMNS = [
  "ean",
  "naam",
  "merk",
  "doeldier",
  "voertype",
  "levensfase",
  "categorie",
  "ingredienten",
  "analyse",
  "verpakking",
  "prijs",
  "bol_url",
  "afbeelding",
  "bron",
  "url",
  "opmerking",
];

