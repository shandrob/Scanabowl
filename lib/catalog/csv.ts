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
  ean: ["ean", "barcode", "gtin", "ean-code", "eancode"],
  name: ["naam", "name", "product", "productnaam", "titel", "title"],
  brand: ["merk", "brand"],
  species: ["doeldier", "species", "dier", "animal", "soort dier"],
  foodType: ["voertype", "type", "foodtype", "food type", "voedingstype"],
  lifeStage: ["levensfase", "lifestage", "life stage", "leeftijd", "fase"],
  category: ["categorie", "category"],
  ingredients: ["ingredienten", "ingrediënten", "ingredients", "samenstelling", "composition"],
  analysis: ["analyse", "analysis", "analytische bestanddelen", "analytical constituents"],
  pack: ["verpakking", "pack", "size", "inhoud"],
  price: ["prijs", "price"],
  bolUrl: ["bol_url", "bol", "bolurl", "bol.com", "bol-link"],
  image: ["afbeelding", "image", "foto"],
  source: ["bron", "source"],
  url: ["url", "link", "bronlink"],
  notes: ["opmerking", "notes", "notitie"],
  status: ["status"],
};

export type Field = keyof typeof ALIASES;

export function field(row: Record<string, string>, f: Field): string {
  for (const key of ALIASES[f]) {
    const v = row[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
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
