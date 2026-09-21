# The Scanabowl food database

All foods live in CSV files in this folder. Excel opens them (both `;` and `,` delimiters work; save as UTF-8).

```
database/
  scraped/     products collected by the scraper (do not need hand-editing; you can, though)
  manual/      products you add or approve - these WIN over scraped rows with the same EAN
  overrides.csv   optional fixes by EAN that survive re-scraping
  images/      optional photos named <EAN>.jpg / .png / .webp
  build-report.txt   written by `npm run data:build`: what to fix
```

Files whose name starts with `_` or `~` are ignored (so `manual/_template.csv` is safe to keep).

## Columns

| Column | Meaning |
| --- | --- |
| `ean` | barcode, 8 or 13 digits (12-digit UPC codes are fixed automatically). Keep the column as **text** in Excel. |
| `naam` | product name, without the brand if you like – the brand is added automatically |
| `merk` | brand. Leave empty and it is derived from the name |
| `doeldier` | `Hond` or `Kat` |
| `voertype` | `Droogvoer`, `Natvoer`, `Diepvriesvoer`, `Halfvochtig` or `Overig`. What you type is trusted. |
| `levensfase` | `Jong (puppy/kitten)`, `Volwassen`, `Senior` or `Alle leeftijden` |
| `categorie` | `Volledig` (scored), `Aanvullend`, `Dieetvoer (dierenarts)`, `Snack`, `Supplement` (not scored). Empty = detected from the name |
| `ingredienten` | the composition **exactly as printed on the pack**, including percentages and brackets |
| `analyse` | the analytical constituents as printed, e.g. `Ruw eiwit 30%, ruw vet 15%, ruwe as 7%, ruwe celstof 3%, vocht 9%` (moisture, calcium, phosphorus and kcal/kg are used when present) |
| `verpakking` | pack size, e.g. `12x85 g`, `2 kg` |
| `prijs` | optional price in euro of that pack (enables "cost per day" for pet owners) |
| `bol_url` | optional exact bol.com product link (otherwise a bol.com search by EAN is used) |
| `afbeelding` | not needed – photos are matched by EAN from `images/` |
| `bron` | `scraped`, `manual`, `brand` (supplied by the manufacturer) or `user` |
| `url`, `opmerking` | source link and your own notes |

## Common jobs

* **Add a food:** copy `manual/_template.csv` to e.g. `manual/mijn-voer.csv`, add rows, run `npm run data:build`.
* **Fix one wrong ingredient list without touching scraped data:** add a row to `overrides.csv` with the EAN and only the columns to change.
* **Remove a food:** delete its row (scraped foods reappear if you scrape again – put `categorie` = `Snack` in `overrides.csv` to hide it from the finder permanently, or just leave it).
* **Add a photo:** save it as `images/<EAN>.jpg` (any size), run `npm run data:build`.

The data is cleaned automatically on every build: EAN repair, brand detection from the name, dry/wet detection from moisture and name,
detection of veterinary diets and treats, garbage-row removal. What you type in a column is respected.
