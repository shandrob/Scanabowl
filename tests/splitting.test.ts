import { describe, expect, it } from "vitest";
import { splitGroups } from "../lib/scoring/splitting";

describe("ingredient splitting", () => {
  it("groups one plant in several forms when together it is a real part of the recipe", () => {
    const g = splitGroups([
      { raw: "gedroogde zalm", kind: "fish", share: 27 },
      { raw: "gele erwten", kind: "legume", share: 14 },
      { raw: "erwtenzetmeel", kind: "legume", share: 10 },
      { raw: "erwteneiwit", kind: "legume_protein", share: 7 },
      { raw: "kipvet", kind: "animal_fat", share: 6 },
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].forms).toEqual(["gele erwten", "erwtenzetmeel", "erwteneiwit"]);
    expect(g[0].share).toBe(31);
    expect(g[0].outweighsFirst).toBe(true);
  });

  it("ignores varieties and small amounts", () => {
    expect(
      splitGroups([
        { raw: "kip", kind: "meat", share: 60 },
        { raw: "rode linzen", kind: "legume", share: 3 },
        { raw: "groene linzen", kind: "legume", share: 2 },
        { raw: "linzenvezel", kind: "fibre", share: 1 },
      ]),
    ).toEqual([]);
  });

  it("keeps chickpeas apart from peas and sweet potato apart from potato", () => {
    const g = splitGroups([
      { raw: "kip", kind: "meat", share: 30 },
      { raw: "kikkererwten", kind: "legume", share: 15 },
      { raw: "erwteneiwit", kind: "legume_protein", share: 12 },
      { raw: "zoete aardappel", kind: "tuber", share: 12 },
      { raw: "aardappelzetmeel", kind: "tuber", share: 11 },
    ]);
    expect(g).toEqual([]);
  });
});
