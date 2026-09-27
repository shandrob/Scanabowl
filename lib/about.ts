import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { DEFAULT_LOCALE, type Locale } from "./i18n/config";

/**
 * The owner's story on the About page lives in content/about/<lang>.md, so it can be edited on GitHub like a
 * blog post. The photo is content/about/photo.jpg (or .png/.webp); the data build turns it into
 * public/about-photo.webp. Without a photo the page simply shows the text.
 */
const DIR = path.join(process.cwd(), "content", "about");
export const ABOUT_PHOTO = "/about-photo.webp";

export interface AboutStory {
  title: string;
  photoAlt: string;
  html: string;
  photo: string | null;
}

export function aboutStory(lang: Locale): AboutStory | null {
  const file = [lang, DEFAULT_LOCALE].map((l) => path.join(DIR, `${l}.md`)).find((f) => fs.existsSync(f));
  if (!file) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const photo = fs.existsSync(path.join(process.cwd(), "public", ABOUT_PHOTO.slice(1))) ? ABOUT_PHOTO : null;
  return {
    title: String(data.title ?? ""),
    photoAlt: String(data.photoAlt ?? ""),
    html: marked.parse(content, { async: false }) as string,
    photo,
  };
}
