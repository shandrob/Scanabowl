# Scanabowl Score – technical reference

Public explanation (with sources): the website page `/nl/how-we-score` (`messages/*.json` → `method.*`).
This file is for whoever maintains the code.

## Pipeline

```
database/*.csv ──► lib/catalog/records.ts   clean row → CatalogProduct (EAN, brand, type, stage, category)
                ──► lib/scoring/score.ts     scoreProduct() → ScoreResult
                        ├─ parse-analysis.ts      "Ruw eiwit: 31,0%" → {protein, fat, fibre, ash, moisture, ca, p, kcal}
                        ├─ nutrition.ts           dry matter, NFE (carbs), ME (FEDIAF/NRC equation), per-1000-kcal values
                        ├─ parse-ingredients.ts   label text → ordered tokens (+ declared %, estimated shares)
                        └─ taxonomy.ts            token → kind (meat, fish, cereal, …), protein fraction, clarity, DM fraction, tags
                ──► scripts/build-data.ts    writes data/generated/*.json + public/data/index.*.json
lib/scoring/allergens.ts   allergen groups; "definite" vs "possible" (vague label wording)
lib/scoring/personalize.ts personal adjustment (-20…+8) per pet; lib/pets/energy.ts life stage + kcal/day
```

## Point structure (100)

| Pillar | Pts | Components |
| --- | --- | --- |
| Nutrient profile | 35 | **Cat:** protein 12, fat 2.5, carbs 10, fibre+ash 3, moisture 7.5 · **Dog:** protein 12, fat 6, carbs 4, fibre+ash 4, Ca:P + label completeness 9 |
| Ingredient quality | 50 | protein origin 12 + animal share of dry matter 12, lead ingredients 10, named sources 10, extras 6 |
| Clean formulation | 15 | start 15; deductions: sugar, colourants, synthetic preservatives, plant-protein isolates, cereal filler (cats), legume/potato load (dogs) |

* Hazard (toxic ingredient for the species) → total capped at 25, grade E.
* Below FEDIAF protein minimum per 1,000 kcal → −3 in the nutrient pillar.
* `category !== "complete"` or no ingredient list → not scored (`notScored`).
* Grades: A ≥ 85, B ≥ 72, C ≥ 58, D ≥ 42, else E (`GRADE_LIMITS` in `score.ts`, used everywhere).
* Confidence: high = no defaulted values; medium = 1–2 (moisture/ash/fibre) estimated; low = 3 or no analysis.

## Reference values (verified against primary sources)

FEDIAF Nutritional Guidelines, October 2021 (`nutrition.ts → FEDIAF_MIN`, tables III-3/III-4):

| | protein g/100 g DM | protein g/1000 kcal | fat g/100 g DM |
| --- | --- | --- | --- |
| adult dog | 18.0 (110 kcal/kg^0.75) – 21.0 (95) | 45.0 – 52.1 | 5.5 |
| growing dog | 25.0 early / 20.0 late | 62.5 / 50.0 | 8.5 |
| adult cat | 25.0 (100 kcal/kg^0.67) – 33.3 (75) | 62.5 – 83.3 | 9.0 |
| growing cat | 28–30 | 70–75 | 9.0 |

* ME equation: FEDIAF Annex 7.2.2(a) = NRC 2006 (4-step; implemented in `estimateMePer100g`).
* Energy needs (`lib/pets/energy.ts`): dogs 95/110/125–135 kcal/kg^0.75 by activity, ×1.14 for 1–2 y, ×0.9 seniors; puppies `(254.1 − 135 × BW/adultBW) × BW^0.75`; cats 75 (neutered/indoor) – 100 (active) kcal/kg^0.67; kittens 2.25/1.9/1.5 × 100 kcal/kg^0.67 (<4 mo / 4–9 mo / 9–12 mo). Large-breed puppy calcium ceiling 1.8 g/100 g DM.

## Ingredient share estimation

Label order = weight *as mixed* (with water). `estimateShares()`: declared percentages are used as given; the
remainder is spread over undeclared ingredients with geometric decay (r = 0.72), never exceeding the
preceding ingredient; trailing minerals/vitamins get a fixed 0.4%. Each ingredient has a dry-matter fraction
(fresh meat 0.27, meal 0.92, cereals 0.88, oils 1, veg 0.15) and a typical protein fraction so that
"animal share of protein" and "animal share of dry matter" can be estimated. These are *relative* estimates.

## Changing the method

1. Edit weights/anchors in `score.ts` (`lin(x, [[x0,y0],…])` = piecewise-linear).
2. `npx tsx scripts/score-report.ts --pillars --samples` shows the score distribution, brand medians and top/bottom foods.
3. `npm test` – every rule has tests; add one for new rules.
4. Bump the version sentence in `messages/*.json → method.version`, and mention the change on the methodology page.

Calibration used for v1.0 (3,054 foods): dog dry median 74, dog wet 82, cat dry 54, cat wet 67;
mass-market brands 40s–60s, meat-dense premium foods 80s–90s. Wet cat food outscores dry cat food by ~13 points
on average (moisture, carbohydrates), by design (Buckley 2011; Hewson-Hughes 2011).

## Adding ingredients / languages to recognition

`taxonomy.ts` holds the multilingual (NL/EN/DE/FR) patterns on *normalised* text (lower-case, accents removed).
Add a pattern to `SPECIES` to make an ingredient count as an allergen source; add it to `DEFINITE` in
`allergens.ts` to map it to an allergen chip (and to `ALLERGEN_IDS` + all four `messages/*.json` for a new chip).
