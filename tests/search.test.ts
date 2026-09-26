import { describe, expect, it } from "vitest";
import { matchesQuery, queryTerms, searchHaystack } from "../lib/search";

const find = (query: string, brand: string, name: string, ean = "") => matchesQuery(searchHaystack(brand, name, ean), queryTerms(query));

describe("food search", () => {
  it("ignores apostrophes and punctuation", () => {
    expect(find("hills", "Hill's", "Hill's Science Plan Adult Kip")).toBe(true);
    expect(find("edgard cooper", "Edgard & Cooper", "Edgard&Cooper Adult Kip")).toBe(true);
  });
  it("finds Dutch product names with English, German and French words", () => {
    expect(find("chicken", "Acana", "Acana Adult Kip")).toBe(true);
    expect(find("lachs", "Orijen", "Orijen Six Fish Zalm")).toBe(true);
    expect(find("saumon kitten", "Royal Canin", "Royal Canin Kitten Zalm")).toBe(true);
    expect(find("kip", "Applaws", "Applaws Cat Chicken Breast")).toBe(true);
  });
  it("matches every spelling of sterilised", () => {
    for (const q of ["sterilized", "sterilised", "gesteriliseerd"]) expect(find(q, "Royal Canin", "Royal Canin Sterilised 37")).toBe(true);
  });
  it("finds a food by its barcode", () => {
    expect(find("8710255127422", "Iams", "Iams Cat Adult Zeevis", "8710255127422")).toBe(true);
  });
  it("still requires every word", () => {
    expect(find("kip zalm", "Acana", "Acana Adult Kip")).toBe(false);
    expect(find("orijen", "Acana", "Acana Adult Kip")).toBe(false);
  });
});
