import { describe, expect, it } from "vitest";
import { cleanPath, dayKey, isBot, visitorHash } from "../lib/visits";

describe("own visitor counter", () => {
  it("counts days in Dutch time", () => {
    expect(dayKey(new Date("2026-10-18T21:30:00Z"))).toBe("2026-10-18");
    expect(dayKey(new Date("2026-10-18T22:30:00Z"))).toBe("2026-10-19"); // 00:30 in Amsterdam
  });
  it("leaves robots and link previews out", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("WhatsApp/2.23.20.0 A")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1")).toBe(false);
  });
  it("keeps only the page address, and skips virtual pages", () => {
    expect(cleanPath("/nl/foods/brit-care?utm=x#top")).toBe("/nl/foods/brit-care");
    expect(cleanPath("/nl/no-results/kitekat")).toBeNull();
    expect(cleanPath("https://evil.example/")).toBeNull();
    expect(cleanPath(42)).toBeNull();
  });
  it("gives a visitor a different hash every day", () => {
    const a = visitorHash("2026-10-18", "1.2.3.4", "ua", "s");
    expect(a).toBe(visitorHash("2026-10-18", "1.2.3.4", "ua", "s"));
    expect(a).not.toBe(visitorHash("2026-10-19", "1.2.3.4", "ua", "s"));
  });
});
