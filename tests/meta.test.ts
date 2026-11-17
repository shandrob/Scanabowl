import { describe, expect, it } from "vitest";
import { clampDescription } from "../lib/meta";

describe("clampDescription", () => {
  it("leaves short text unchanged without adding an ellipsis", () => {
    const short = "Kattenvoer met hoge score en duidelijke ingrediënten.";
    expect(clampDescription(short)).toBe(short);

    const exact = "a".repeat(155);
    expect(clampDescription(exact)).toBe(exact);
    expect(clampDescription(exact).endsWith("…")).toBe(false);
  });

  it("cuts long text at a word boundary and stays at most 156 characters including …", () => {
    const words = Array.from({ length: 30 }, (_, i) => `ingredient${i}`).join(" ");
    const out = clampDescription(words);

    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(156);
    expect(words.startsWith(out.slice(0, -1))).toBe(true);
    // Ended on a full word, not mid-token: the next character in the source was a space
    expect(words[out.length - 1]).toBe(" ");
  });

  it("handles a word ending exactly at the max length and strings without spaces", () => {
    const exactBoundary = `${"a".repeat(155)} trailing`;
    const boundaryOut = clampDescription(exactBoundary);
    expect(boundaryOut).toBe(`${"a".repeat(155)}…`);
    expect(boundaryOut.length).toBe(156);

    const unbroken = "x".repeat(200);
    const unbrokenOut = clampDescription(unbroken);
    expect(unbrokenOut).toBe(`${"x".repeat(155)}…`);
    expect(unbrokenOut.length).toBe(156);
  });

  it("strips trailing separator punctuation before the ellipsis", () => {
    const text = `Acana Heritage Adult Large Breed, ${"kip ".repeat(40)}`;
    const out = clampDescription(text);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(156);
    expect(out).not.toMatch(/[\s,;:\-–—]…$/);
  });
});
