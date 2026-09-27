import { describe, expect, it } from "vitest";
import { stageInName } from "../lib/catalog/clean";
import { noResultSlug } from "../lib/analytics";
import { createT, fillLinkLanguage } from "../lib/i18n/t";

describe("life stage in the product name", () => {
  it("wins over loose shop tags", () => {
    expect(stageInName("Applaws Cat Adult - Kip 400 g")).toBe("adult");
    expect(stageInName("Orijen Whole Prey Cat & Kitten Kip&Kalkoen")).toBe("all");
    expect(stageInName("Royal Canin Kitten 2 kg")).toBe("young");
    expect(stageInName("Eukanuba Senior Small Breed")).toBe("senior");
    expect(stageInName("Hill's Feline Young Adult Sterilised")).toBe("adult");
    expect(stageInName("Carnilove Cans Chicken & Lamb")).toBeUndefined();
  });
});

describe("searches without results", () => {
  it("are reported as a short, readable address without personal details", () => {
    expect(noResultSlug("Kitekat  Kip & Rijst!")).toBe("kitekat-kip-rijst");
    expect(noResultSlug("Pâtée für Katzen")).toBe("patee-fur-katzen");
    expect(noResultSlug("x".repeat(100)).length).toBe(60);
  });
});

describe("links in texts", () => {
  it("get the page language, while a plain {lang} placeholder keeps working", () => {
    const t = createT(fillLinkLanguage({ a: "Zie de [methode](/{lang}/how-we-score).", b: "Originele versie ({lang})." }, "nl"));
    expect(t("a")).toBe("Zie de [methode](/nl/how-we-score).");
    expect(t("b", { lang: "English" })).toBe("Originele versie (English).");
  });
});
