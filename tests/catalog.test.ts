import { describe, expect, it } from "vitest";
import { cleanName, inferCategory } from "../lib/catalog/clean";
import { rowToProduct } from "../lib/catalog/records";
import { parseSubmission, toCsvRows, toText } from "../lib/submissions";

describe("scraper output cleaning", () => {
  it("removes shop suffixes and category words from product names", () => {
    expect(cleanName("Prins Procare Super Active - Hondenvoer - Hondenbrokken - Pets Place")).toBe("Prins Procare Super Active");
  });
});

describe("submissions", () => {
  const product = { name: "Adult Zalm", brand: "TestBrand", species: "cat", foodType: "wet", lifeStage: "adult", ean: "8712345678901", ingredients: "zalm 50%, rijst", analysis: "Eiwit 10%", pack: "85 g", url: "" };

  it("accepts a visitor suggestion and produces a ready-to-paste database row", () => {
    const r = parseSubmission({ kind: "product", email: "a@b.nl", consent: true, products: [product] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const csv = toCsvRows(r.data);
    expect(csv).toContain('"8712345678901";"Adult Zalm";"TestBrand";"Kat";"Natvoer"');
    expect(csv).toContain('"user"');
    expect(toText(r.data)).toContain("Adult Zalm");
  });

  it("requires consent when an email address is given", () => {
    const r = parseSubmission({ kind: "product", email: "a@b.nl", products: [product] });
    expect(r.ok).toBe(false);
  });

  it("marks brand submissions as coming from the brand and needs the authorisation checkbox", () => {
    const base = { kind: "brand", email: "info@brand.com", company: { name: "TestBrand", contact: "Jan", website: "https://brand.com" }, products: [product], consent: true };
    expect(parseSubmission({ ...base, authorised: false }).ok).toBe(false);
    const ok = parseSubmission({ ...base, authorised: true });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(toCsvRows(ok.data)).toContain('"brand"');
  });

  it("rejects malformed input and clips oversized text", () => {
    expect(parseSubmission(null).ok).toBe(false);
    const r = parseSubmission({ kind: "product", products: [{ ...product, ingredients: "x".repeat(9000) }] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.products[0].ingredients.length).toBe(4000);
  });

  it("caps the number of products per submission", () => {
    const many = Array.from({ length: 30 }, () => product);
    const r = parseSubmission({ kind: "brand", email: "a@b.nl", company: { name: "X", contact: "Y", website: "https://x.nl" }, products: many, authorised: true, consent: true });
    expect(r.ok && r.data.products.length).toBe(12);
  });
});

describe("rowToProduct", () => {
  const ctx = { knownBrands: ["Royal Canin"], defaultSource: "manual" as const, trustDeclared: true };
  it("trusts a brand typed into the master database", () => {
    const p = rowToProduct({ naam: "Zalm Menu", merk: "TestMerk", doeldier: "Kat", ingredienten: "zalm, rijst, mineralen" }, ctx);
    expect(p?.brand).toBe("TestMerk");
  });
  it("still repairs junk brands from the scraper", () => {
    const p = rowToProduct({ naam: "Royal Canin Adult Kip", merk: "en Dogwash Trimsalon", doeldier: "Kat", ingredienten: "kip, rijst, mineralen" }, ctx);
    expect(p?.brand).toBe("Royal Canin");
  });
  it("trusts the food type and life stage a person typed", () => {
    const p = rowToProduct({ naam: "Lara Adult Kip 12x85 g", doeldier: "Kat", voertype: "Droogvoer", levensfase: "Senior", ingredienten: "kip, rijst, mineralen" }, ctx);
    expect(p?.foodType).toBe("dry");
    expect(p?.lifeStage).toBe("senior");
  });
  it("treats scraper placeholders and pack sizes as missing ingredient text", () => {
    for (const junk of ["NIET GEVONDEN", "Gewicht: 2.5 kg", "1,5 kg", "n.v.t."]) {
      const p = rowToProduct({ naam: "Testvoer Adult Kip", doeldier: "Kat", ingredienten: junk }, ctx);
      expect(p?.ingredients).toBe("");
    }
  });
  it("drops rows without a usable name, species or garbage text", () => {
    expect(rowToProduct({ naam: "Natvoer", doeldier: "Kat" }, ctx)).toBeNull();
    expect(rowToProduct({ naam: "Iets moois", doeldier: "" }, ctx)).toBeNull();
  });
});

describe("soups and broths", () => {
  it("are complementary, not complete", () => {
    for (const name of ["Felix Soup Vis Selectie 6x48 g", "Schesir Soup - Kip Wortel Pompoen 40 g", "Inaba Dashi Delights Silky Broth 40 g"]) {
      expect(inferCategory({ name })).toBe("complementary");
    }
  });
  it("leave wet food 'in broth' or 'in bouillon' alone", () => {
    expect(inferCategory({ name: "Schesir Complete In Bouillon - Tonijn 6x70 g" })).toBe("complete");
    expect(inferCategory({ name: "Applaws Tuna Fillet in Broth" })).toBe("complete");
  });
});

describe("supplements", () => {
  it("does not mistake a food named 'Omega' for a supplement", () => {
    expect(inferCategory({ name: "Renske Mighty Omega Plus - Kip 12 kg" })).toBe("complete");
    expect(inferCategory({ name: "Renske Mighty Omega Plus Adult Geperst Zalm" })).toBe("complete");
  });
  it("still recognises real supplements", () => {
    expect(inferCategory({ name: "Zalmolie Omega 3 voor honden 500 ml" })).toBe("supplement");
    expect(inferCategory({ name: "Glucosamine tabletten" })).toBe("supplement");
  });
});

describe("photo attachments", () => {
  const photo = (data = "QUJD", type = "image/jpeg") => ({ name: "voorkant.HEIC", type, data });
  const base = { kind: "product", products: [{ name: "Testvoer Kip", brand: "Test" }] };
  it("accepts up to four photos and names them safely", () => {
    const r = parseSubmission({ ...base, photos: [photo(), photo()], photoPermission: true });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.photos?.map((p) => p.filename)).toEqual(["1-voorkant.jpg", "2-voorkant.jpg"]);
      expect(r.data.photoPermission).toBe(true);
      expect(toText(r.data)).toContain("2 foto's van de verpakking bijgevoegd");
    }
  });
  it("rejects too many, too large or non-image files", () => {
    expect(parseSubmission({ ...base, photos: [photo(), photo(), photo(), photo(), photo()] }).ok).toBe(false);
    expect(parseSubmission({ ...base, photos: [photo("A".repeat(1_000_000))] }).ok).toBe(false);
    expect(parseSubmission({ ...base, photos: [photo("QUJD", "application/pdf")] }).ok).toBe(false);
    expect(parseSubmission({ ...base, photos: [photo("<script>")] }).ok).toBe(false);
  });
  it("ignores photos on the contact form", () => {
    const r = parseSubmission({ kind: "contact", email: "a@b.nl", message: "Hallo daar", consent: true, photos: [photo()] });
    expect(r.ok && r.data.photos).toBeFalsy();
  });
});

describe("non-food rows from the shop", () => {
  const ctx = { knownBrands: [], defaultSource: "scraped" as const, trustDeclared: true };
  it("drops bowls, containers and landing pages", () => {
    expect(rowToProduct({ naam: "Trixie Keramiek Voerbak Bloemmotief - Hondenvoerbak", doeldier: "Hond", voertype: "Voer- & Drinkbakken", ean: "4011905123456" }, ctx)).toBeNull();
    expect(rowToProduct({ naam: "Rotho Mypet Pet Food Container Cody - Kattenvoerbewaarbak", doeldier: "Kat", ean: "4007112123456" }, ctx)).toBeNull();
    expect(rowToProduct({ naam: "Hondenvoer kopen?", doeldier: "Hond" }, ctx)).toBeNull();
  });
  it("keeps real food", () => {
    expect(rowToProduct({ naam: "Fokker Meat Roll - Kip&Zalm 800 g", doeldier: "Hond", voertype: "Natvoer", ean: "8713447021805", ingredienten: "Kip 74,9%, Rijst 17,5%, Zalm 4,7%" }, ctx)).not.toBeNull();
  });
});

describe("shop metadata instead of an ingredient list", () => {
  const ctx = { knownBrands: [], defaultSource: "scraped" as const, trustDeclared: true };
  it("is treated as no ingredient list", () => {
    expect(rowToProduct({ naam: "Beneful Kleine Genieter Rund&Groente", doeldier: "Hond", ingredienten: "Gewicht: 1.4 kg. Smaak: Rund&Groenten." }, ctx)?.ingredients).toBe("");
    expect(rowToProduct({ naam: "Almo Nature Holistic Vis", doeldier: "Kat", ingredienten: "Type: Holistic. Gewicht: 2 kg. Smaak: Vis&Rijst." }, ctx)?.ingredients).toBe("");
  });
  it("keeps a real list that follows the metadata", () => {
    const p = rowToProduct({ naam: "Nutro Puppy Lam&Rijst", doeldier: "Hond", ingredienten: "Gewicht: 2 kg. Smaak: Lam&Rijst. Rijst (3%), maïsproteïnen, gedroogd ontvet lamsvlees (18%), gevogeltevet (8%)" }, ctx);
    expect(p?.ingredients).toContain("maïsproteïnen");
  });
  it("drops the shop's 'page not found' rows", () => {
    expect(rowToProduct({ naam: "Oeps, niet gevonden...", doeldier: "Kat", ingredienten: "Kip, rijst" }, ctx)).toBeNull();
  });
});
