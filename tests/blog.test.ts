import { describe, expect, it } from "vitest";
import { getPost, listPosts, postLanguages } from "../lib/blog";

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("scheduled blog publishing", () => {
  it("hides a post until its publish date has passed", () => {
    const before = listPosts("nl", day("2026-09-27")).map((p) => p.slug);
    const after = listPosts("nl", day("2026-09-29")).map((p) => p.slug);
    expect(before).not.toContain("2026-09-28-natvoer-kat-water");
    expect(after).toContain("2026-09-28-natvoer-kat-water");
  });

  it("returns nothing for a future post when opened directly by its URL", () => {
    expect(getPost("nl", "2026-09-28-natvoer-kat-water", day("2026-09-20"))).toBeNull();
    expect(getPost("nl", "2026-09-28-natvoer-kat-water", day("2026-10-01"))?.title).toMatch(/natvoer/i);
  });

  it("never shows drafts, however long ago their date was", () => {
    const slugs = listPosts("nl", day("2030-01-01")).map((p) => p.slug);
    expect(slugs).not.toContain("2026-01-12-kat-uitdroging-winter");
    expect(slugs).not.toContain("2026-01-19-hond-winterdip-darmen");
    expect(getPost("nl", "2026-01-12-kat-uitdroging-winter", day("2030-01-01"))).toBeNull();
  });

  it("never lists the template folder", () => {
    expect(listPosts("nl", day("2030-01-01")).some((p) => p.slug.startsWith("_"))).toBe(false);
  });

  it("serves the translation when it exists and falls back to Dutch when it does not", () => {
    const now = day("2026-10-05");
    const en = getPost("en", "2026-09-21-etiket-lezen", now)!;
    expect(en.lang).toBe("en");
    expect(en.translated).toBe(true);
    const de = getPost("de", "2026-09-21-etiket-lezen", now)!;
    expect(de.lang).toBe("nl");
    expect(de.translated).toBe(false);
    expect(postLanguages("2026-09-21-etiket-lezen")).toEqual(expect.arrayContaining(["nl", "en"]));
  });

  it("renders Markdown to HTML with headings, lists and tables", () => {
    const html = getPost("nl", "2026-09-21-etiket-lezen", day("2026-10-05"))!.html;
    expect(html).toContain("<h2");
    expect(html).toContain("<table");
    expect(html).toContain("<strong>");
  });

  it("points cover images at the optimised copy", () => {
    const p = getPost("nl", "2026-01-12-kat-uitdroging-winter", day("2030-01-01"));
    expect(p).toBeNull(); // draft
    const dir = listPosts("nl", day("2030-01-01"));
    expect(dir.every((x) => !x.cover || x.cover.startsWith("/blog-images/"))).toBe(true);
  });
});
