import { describe, expect, it } from "vitest";
import { betterThanCurrent } from "../components/pet/CurrentFoodAdvice";
import type { IndexEntry } from "../lib/data/types";
import { personalFit } from "../lib/scoring/personalize";
import type { PetProfile } from "../lib/scoring/types";

const pet = (over: Partial<PetProfile> = {}): PetProfile => ({
  id: "p",
  name: "Bella",
  species: "cat",
  ageYears: 4,
  weightKg: 4,
  neutered: true,
  activity: "moderate",
  bodyCondition: "ideal",
  allergens: [],
  customAllergens: [],
  strictAllergies: true,
  ...over,
});

const food = (over: Partial<IndexEntry> & { i: string; sc: number }): IndexEntry => ({
  e: over.i,
  s: over.i,
  n: `Food ${over.i}`,
  b: `Brand ${over.i}`,
  t: "dry",
  l: "adult",
  c: "complete",
  g: "B",
  gf: 0,
  im: 0,
  ad: [],
  ap: [],
  pr: ["chicken"],
  k: 380,
  pk: "2 kg",
  cf: "high",
  nu: [40, 18, 40, 8, 1.2],
  ...over,
});

describe("pet profile: food the pet refuses", () => {
  it("is reported when the label names it, without calling it an allergy", () => {
    const fit = personalFit(food({ i: "a", sc: 80, ad: ["fish", "chicken"] }), pet({ dislikes: ["fish"] }));
    expect(fit.disliked).toEqual(["fish"]);
    expect(fit.allergy.excluded).toBe(false);
  });
});

describe("pet profile: pregnant or nursing", () => {
  it("asks for a growth food, like FEDIAF's 'growth and reproduction' standard", () => {
    const mum = pet({ neutered: false, reproduction: "nursing" });
    expect(personalFit(food({ i: "adult", sc: 80, l: "adult" }), mum).notes.some((n) => n.code === "repro_growth_needed")).toBe(true);
    const kitten = personalFit(food({ i: "kitten", sc: 80, l: "young" }), mum);
    expect(kitten.notes.some((n) => n.code === "repro_match")).toBe(true);
    expect(kitten.notes.some((n) => n.code === "stage_too_rich")).toBe(false);
  });
});

describe("pet profile: better than the current food", () => {
  const current = food({ i: "cur", sc: 60 });
  const index = [
    current,
    food({ i: "better", sc: 85 }),
    food({ i: "better-same-brand", sc: 84, b: "Brand better" }),
    food({ i: "wet", sc: 95, t: "wet" }),
    food({ i: "fish", sc: 90, ad: ["fish"] }),
    food({ i: "barely", sc: 62 }),
  ];
  it("suggests the same kind of food, one per brand, clearly better and safe for this pet", () => {
    const list = betterThanCurrent(index, pet({ allergens: ["fish"] }), current);
    expect(list.map((r) => r.e.i)).toEqual(["better"]);
  });
  it("follows the type the owner wants to feed", () => {
    expect(betterThanCurrent(index, pet({ preferredType: "wet" }), current).map((r) => r.e.i)).toEqual(["wet"]);
  });
});
