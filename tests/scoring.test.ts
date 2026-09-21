import { describe, expect, it } from "vitest";
import { parseAnalysis } from "../lib/scoring/parse-analysis";
import { parseIngredients } from "../lib/scoring/parse-ingredients";
import { detectAllergens, checkAllergies } from "../lib/scoring/allergens";
import { computeNutrition, estimateMePer100g } from "../lib/scoring/nutrition";
import { scoreProduct, gradeFor } from "../lib/scoring/score";
import { dailyEnergy, gramsPerDay, lifeStageOf, packGrams } from "../lib/pets/energy";
import { normalizeEan, inferFoodType, inferCategory, cleanName, extractPack } from "../lib/catalog/clean";
import type { PetProfile } from "../lib/scoring/types";

const pet = (over: Partial<PetProfile> = {}): PetProfile => ({
  id: "t",
  name: "Test",
  species: "dog",
  weightKg: 15,
  neutered: false,
  activity: "moderate",
  bodyCondition: "ideal",
  allergens: [],
  customAllergens: [],
  strictAllergies: true,
  ageYears: 4,
  ...over,
});

describe("parseAnalysis", () => {
  it("reads the usual Dutch label formats", () => {
    const a = parseAnalysis("Ruw eiwit: 31,0% - Ruwe celstof: 2,7% - Ruw vet: 21,0% - Ruwe as: 6,5% - Metaboliseerbare energie: 4.216kcal/kg.");
    expect(a).toMatchObject({ protein: 31, fibre: 2.7, fat: 21, ash: 6.5, kcalPer100g: 422 });
  });
  it("reads values without a percent sign", () => {
    const a = parseAnalysis("Ruw Eiwit: 5,9;Ruwe Celstof: 0,1;Ruw Vet: 3;Ruwe As: 0,3;Vocht: 89");
    expect(a).toMatchObject({ protein: 5.9, fibre: 0.1, fat: 3, ash: 0.3, moisture: 89 });
  });
  it("does not confuse fatty acids with fat", () => {
    const a = parseAnalysis("Eiwit: 26%, Vetgehalte: 15%, Omega-6 vetzuren: 2,1%, Ruwe as: 6,4%");
    expect(a.fat).toBe(15);
  });
  it("rejects garbage that adds up to more than 100 %", () => {
    expect(parseAnalysis("Eiwit 60%, vet 40%, as 30%, vocht 20%")).toEqual({});
  });
});

describe("ingredient parsing", () => {
  it("strips scraper header junk and uses | as separator", () => {
    const { ingredients } = parseIngredients("Gewicht: 3 kg. ingrediënten: rijst | kip 20% | dierlijk vet");
    expect(ingredients.map((i) => i.raw)).toEqual(["rijst", "kip", "dierlijk vet"]);
    expect(ingredients[1].pct).toBe(20);
  });
  it("reads a percentage that sits inside brackets", () => {
    const { ingredients } = parseIngredients("vlees en dierlijke bijproducten (14%, waarvan rund 4%), mineralen");
    expect(ingredients[0].pct).toBe(14);
    expect(ingredients[0].info.kind).toBe("generic_animal");
  });
  it("keeps only the first flavour of a multipack", () => {
    const { ingredients } = parseIngredients("met Rund: Samenstelling: rund 40%, rijst. met Kip: Samenstelling: kip 40%, rijst.");
    expect(ingredients.some((i) => /kip/i.test(i.raw))).toBe(false);
  });
  it("estimates shares that add up to 1 and never grow down the list", () => {
    const { ingredients } = parseIngredients("kip (gedehydreerd) 25%, rijst, maïs, dierlijk vet, gist, mineralen");
    expect(ingredients.reduce((s, i) => s + i.share, 0)).toBeCloseTo(1, 5);
    expect(ingredients[2].share).toBeLessThanOrEqual(ingredients[1].share + 1e-9);
  });
});

describe("allergens", () => {
  it("finds named sources in Dutch, English and German", () => {
    expect(detectAllergens("Kippenvet, rundvlees, zalmolie").definite).toEqual(expect.arrayContaining(["chicken", "beef", "fish"]));
    expect(detectAllergens("chicken meal, wheat, whey").definite).toEqual(expect.arrayContaining(["chicken", "wheat", "dairy"]));
    expect(detectAllergens("Huhn, Weizen, Lachs").definite).toEqual(expect.arrayContaining(["chicken", "wheat", "fish"]));
  });
  it("does not treat protein or lactic acid as egg or dairy", () => {
    const a = detectAllergens("dierlijk eiwit, melkzuur, plantaardig eiwitextract");
    expect(a.definite).not.toContain("egg");
    expect(a.definite).not.toContain("dairy");
  });
  it("marks vague wording as possible, never as definite", () => {
    const a = detectAllergens("vlees en dierlijke bijproducten, granen");
    expect(a.definite).toEqual([]);
    expect(a.possible).toEqual(expect.arrayContaining(["chicken", "beef", "pork", "wheat", "corn"]));
    expect(a.possible).not.toContain("fish");
  });
  it("hides a product for an allergic pet in strict mode, and only definite hits otherwise", () => {
    const match = detectAllergens("vlees en dierlijke bijproducten, rijst");
    const strict = checkAllergies(match, undefined, { allergens: ["chicken"], customAllergens: [], strictAllergies: true });
    const loose = checkAllergies(match, undefined, { allergens: ["chicken"], customAllergens: [], strictAllergies: false });
    expect(strict.excluded).toBe(true);
    expect(loose.excluded).toBe(false);
    const named = checkAllergies(detectAllergens("kip, rijst"), undefined, { allergens: ["chicken"], customAllergens: [], strictAllergies: false });
    expect(named.excluded).toBe(true);
  });
  it("resolves custom allergen words in another language", () => {
    const v = checkAllergies(detectAllergens("kalkoen, rijst"), "kalkoen, rijst", { allergens: [], customAllergens: ["turkey"], strictAllergies: true });
    expect(v.excluded).toBe(true);
  });
});

describe("energy and portions (FEDIAF 2021)", () => {
  it("matches the FEDIAF worked example: 15 kg dog at 110 kcal/kg^0.75 = 838 kcal", () => {
    const e = dailyEnergy(pet({ weightKg: 15, ageYears: 4 }));
    expect(e.kcal).toBe(838);
  });
  it("matches the FEDIAF worked example: 4 kg neutered cat at 75 kcal/kg^0.67 = ~189 kcal", () => {
    const e = dailyEnergy(pet({ species: "cat", weightKg: 4, neutered: true, ageYears: 4 }));
    expect(e.kcal).toBeGreaterThanOrEqual(187);
    expect(e.kcal).toBeLessThanOrEqual(192);
  });
  it("gives a growing puppy more energy per kg than an adult", () => {
    const puppy = dailyEnergy(pet({ weightKg: 8, ageYears: 0.4, dogSize: "medium" }));
    const adult = dailyEnergy(pet({ weightKg: 8, ageYears: 4 }));
    expect(puppy.stage).toBe("young");
    expect(puppy.kcal).toBeGreaterThan(adult.kcal);
  });
  it("derives life stage from age and size", () => {
    expect(lifeStageOf({ species: "cat", ageYears: 0.5 })).toBe("young");
    expect(lifeStageOf({ species: "cat", ageYears: 11 })).toBe("senior");
    expect(lifeStageOf({ species: "dog", ageYears: 7, dogSize: "giant" })).toBe("senior");
    expect(lifeStageOf({ species: "dog", ageYears: 7, dogSize: "small" })).toBe("adult");
  });
  it("converts energy to grams and parses pack sizes", () => {
    expect(gramsPerDay(838, 380)).toBe(221);
    expect(packGrams("12x85 g")).toBe(1020);
    expect(packGrams("1.5 kg")).toBe(1500);
    expect(packGrams("70 g")).toBe(70);
  });
  it("estimates ME with the NRC/FEDIAF equation", () => {
    // typical dry cat food: 35 % protein, 15 % fat, 3 % fibre, 8 % ash, 8 % moisture
    const me = estimateMePer100g("cat", { protein: 35, fat: 15, fibre: 3, nfe: 31, moisture: 8 });
    expect(me).toBeGreaterThan(370);
    expect(me).toBeLessThan(395);
  });
});

const wetCatMeat = {
  species: "cat" as const,
  foodType: "wet" as const,
  lifeStage: "adult" as const,
  category: "complete" as const,
  ingredients: "kip 60%, kippenlever 10%, bouillon, zalmolie 1%, mineralen, taurine",
  analysis: "Vocht: 80%, Eiwit: 12%, Vetgehalte: 5%, Ruwe as: 1.8%, Ruwe celstof: 0.3%",
};
const dryCatCereal = {
  species: "cat" as const,
  foodType: "dry" as const,
  lifeStage: "adult" as const,
  category: "complete" as const,
  ingredients: "tarwe, maïs, maïsgluten, vlees en dierlijke bijproducten, suiker, plantaardige bijproducten, mineralen",
  analysis: "Eiwit: 28%, Vetgehalte: 11%, Ruwe as: 7%, Ruwe celstof: 3%, Vocht: 9%",
};

describe("scoreProduct", () => {
  it("rewards a meat-based wet cat food far above a cereal-based dry cat food", () => {
    const good = scoreProduct(wetCatMeat);
    const poor = scoreProduct(dryCatCereal);
    expect(good.score!).toBeGreaterThan(poor.score! + 25);
    expect(good.grade).toMatch(/[AB]/);
    expect(poor.grade).toMatch(/[DE]/);
    expect(poor.negatives.map((n) => n.code)).toEqual(expect.arrayContaining(["sugar"]));
  });
  it("never scores veterinary diets, treats or complementary foods", () => {
    for (const category of ["veterinary", "treat", "supplement", "complementary"] as const) {
      const r = scoreProduct({ ...wetCatMeat, category });
      expect(r.score).toBeNull();
      expect(r.notScored).toBe(category);
    }
  });
  it("caps foods with a toxic ingredient at 25", () => {
    const r = scoreProduct({ ...wetCatMeat, ingredients: "kip 60%, uipoeder, mineralen" });
    expect(r.score!).toBeLessThanOrEqual(25);
    expect(r.flags.some((f) => f.severity === "hazard")).toBe(true);
    expect(r.grade).toBe("E");
  });
  it("flags propylene glycol for cats but not for dogs", () => {
    const cat = scoreProduct({ ...wetCatMeat, ingredients: "kip 60%, propyleenglycol, mineralen" });
    const dog = scoreProduct({ ...wetCatMeat, species: "dog", ingredients: "kip 60%, propyleenglycol, mineralen" });
    expect(cat.flags.some((f) => f.code === "propylene_glycol")).toBe(true);
    expect(dog.flags.some((f) => f.code === "propylene_glycol")).toBe(false);
  });
  it("only flags whole grapes, not grape-seed extract in a flavouring", () => {
    const seed = scoreProduct({ ...dryCatCereal, species: "dog", ingredients: "kip, rijst, druivenpitextract, mineralen" });
    expect(seed.flags.some((f) => f.code === "raisins")).toBe(false);
    const raisin = scoreProduct({ ...dryCatCereal, species: "dog", ingredients: "kip, rijst, rozijnen, mineralen" });
    expect(raisin.score!).toBeLessThanOrEqual(25);
  });
  it("lowers confidence when the analysis is missing, and still returns a score", () => {
    const r = scoreProduct({ ...wetCatMeat, analysis: "" });
    expect(r.score).not.toBeNull();
    expect(r.confidence).toBe("low");
    expect(r.negatives.some((n) => n.code === "analysis_missing")).toBe(true);
  });
  it("reports grain-free only when no cereal is listed", () => {
    expect(scoreProduct(wetCatMeat).grainFree).toBe(true);
    expect(scoreProduct(dryCatCereal).grainFree).toBe(false);
  });
  it("keeps scores within 0-100 and grades consistent", () => {
    for (const p of [wetCatMeat, dryCatCereal]) {
      const r = scoreProduct(p);
      expect(r.score!).toBeGreaterThanOrEqual(0);
      expect(r.score!).toBeLessThanOrEqual(100);
      expect(r.grade).toBe(gradeFor(r.score!));
    }
    const pil = scoreProduct(wetCatMeat).pillars!;
    expect(pil.nutrition.max + pil.ingredients.max + pil.formulation.max).toBe(100);
  });
  it("marks a food below the FEDIAF protein minimum", () => {
    const r = scoreProduct({ ...dryCatCereal, analysis: "Eiwit: 18%, Vetgehalte: 11%, Ruwe as: 7%, Ruwe celstof: 3%, Vocht: 9%" });
    expect(r.negatives.some((n) => n.code === "protein_below_min")).toBe(true);
  });
});

describe("nutrition", () => {
  it("converts to dry matter and derives carbohydrates", () => {
    const n = computeNutrition("cat", "wet", { protein: 11, fat: 5, ash: 2, fibre: 0.5, moisture: 80 })!;
    expect(n.dm.protein).toBeCloseTo(55, 0);
    expect(n.asFed.nfe).toBeCloseTo(1.5, 1);
    expect(n.estimated).toEqual([]);
  });
  it("flags defaults when the label omits values", () => {
    const n = computeNutrition("dog", "dry", { protein: 25, fat: 14 })!;
    expect(n.estimated).toEqual(expect.arrayContaining(["moisture", "ash", "fibre"]));
  });
  it("returns null without protein and fat", () => {
    expect(computeNutrition("dog", "dry", { protein: 25 })).toBeNull();
  });
});

describe("catalogue cleaning", () => {
  it("normalises EANs (UPC-A -> EAN-13)", () => {
    expect(normalizeEan("052742042206")).toBe("0052742042206");
    expect(normalizeEan("'8710255187938")).toBe("8710255187938");
    expect(normalizeEan("abc")).toBe("");
  });
  it("infers food type from moisture first, then the name", () => {
    expect(inferFoodType({ name: "X", moisture: 80 })).toBe("wet");
    expect(inferFoodType({ name: "X", moisture: 9 })).toBe("dry");
    expect(inferFoodType({ name: "Whiskas Tasty Mix In Saus Multipack", pack: "40x85 g" })).toBe("wet");
    expect(inferFoodType({ name: "Lara Adult 2 kg", pack: "2 kg" })).toBe("dry");
  });
  it("recognises veterinary diets and treats", () => {
    expect(inferCategory({ name: "Royal Canin Veterinary Diet Renal" })).toBe("veterinary");
    expect(inferCategory({ name: "Hill's Prescription Diet C/D" })).toBe("veterinary");
    expect(inferCategory({ name: "Timo Vleesworst Eend" })).toBe("treat");
    expect(inferCategory({ name: "Lara Adult Kip" })).toBe("complete");
  });
  it("cleans product names and extracts pack sizes", () => {
    expect(cleanName("Royal Canin Fhn Ageing 15+ - Kattenvoer - 12x85 g")).toBe("Royal Canin Fhn Ageing 15+ - 12x85 g");
    expect(extractPack("Sheba Mini Filets - Kip 40x85 g")).toBe("40x85 g");
  });
});

describe("unreliable ingredient text", () => {
  const base = { species: "cat" as const, foodType: "dry" as const, lifeStage: "adult" as const, category: "complete" as const, analysis: "" };
  it("reads a comma-less list with declared percentages", () => {
    const kinds = parseIngredients("Kipfilet 67% Kippenbouillon 24% Ham 8% Rijst 1%").ingredients.map((i) => i.info.kind);
    expect(kinds).toEqual(["meat", "broth", "meat", "cereal"]);
  });
  it("does not let an unclosed bracket swallow the rest of the list", () => {
    const r = parseIngredients("Maïs, tarwe, gedroogde kip en kalkoen (18% ( kip: 10%, natuurlijke bron van glucosamine), sorghum, gerst, dierlijk vet");
    expect(r.ingredients.length).toBeGreaterThanOrEqual(6);
    expect(r.ingredients[2].info.kind).toBe("meat");
  });
  it("recognises free-range chicken compounds", () => {
    expect(parseIngredients("Verse vrije-uitloopkip 50%, erwten").ingredients[0].info.kind).toBe("meat");
  });
  it("gives no score when a cat food list names no animal ingredient (marketing text)", () => {
    const r = scoreProduct({ ...base, name: "Fokker Cat Steri-Fit Kip", ingredients: "De brokken zorgen ervoor dat alle lichaamsfuncties goed worden ondersteund" });
    expect(r.score).toBeNull();
    expect(r.notScored).toBe("ingredients_unclear");
  });
  it("gives no score when a food named after an animal lists none", () => {
    const r = scoreProduct({ ...base, species: "dog", name: "Beneful Volwassen Kip&Groente", ingredients: "Malse brokken bevatten veel eiwitten, Bevat calcium voor sterke tanden" });
    expect(r.notScored).toBe("ingredients_unclear");
  });
  it("still scores a genuinely plant-based dog food", () => {
    const r = scoreProduct({ ...base, species: "dog", name: "Plantbased Adult Rode Biet&Pompoen", ingredients: "erwten, rijst, pompoen, rode biet, zonnebloemolie, mineralen" });
    expect(r.score).not.toBeNull();
  });
});

describe("label quirks", () => {
  it("reads defatted meat as meat, not as fat", () => {
    expect(parseIngredients("Rijst (3%), gedroogd ontvet lamsvlees (18%), gevogeltevet (8%)").ingredients[1].info.kind).toBe("meat");
  });
  it("keeps nested brackets inside their parent ingredient", () => {
    const r = parseIngredients("95% kalkoen (66% (hart, lever, vlees, nek), 29% kalkoenbouillon), 4% boerenkool, 1% mineralen.");
    expect(r.ingredients.map((i) => i.info.kind)).toEqual(["meat", expect.any(String), "mineral"]);
    expect(r.ingredients[0].pct).toBe(95);
  });
});
