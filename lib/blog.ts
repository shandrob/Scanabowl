import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./i18n/config";

/**
 * Blog posts are plain Markdown files:
 *
 *   content/blog/<slug>/<lang>.md      e.g. content/blog/2026-10-05-water-and-cats/nl.md
 *   content/blog/<slug>/cover.jpg      optional images next to the text
 *
 * `date` in the front matter is the PUBLISH date. A post whose date lies in the future stays
 * invisible everywhere (list, page, sitemap, RSS) and appears by itself once the date has passed -
 * the pages re-check the date at most once an hour.
 * A post that is not translated yet is shown in the default language with a notice.
 */

const DIR = path.join(process.cwd(), "content", "blog");

export interface PostMeta {
  slug: string;
  /** language of the text that is shown */
  lang: Locale;
  /** language the visitor asked for */
  requested: Locale;
  title: string;
  description: string;
  date: Date;
  cover?: string;
  tags: string[];
  minutes: number;
  translated: boolean;
}

export interface Post extends PostMeta {
  html: string;
}

function toDate(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function slugDirs(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => d.name);
}

function coverUrl(slug: string, cover: unknown): string | undefined {
  if (typeof cover !== "string" || !cover) return undefined;
  if (/^https?:\/\//.test(cover) || cover.startsWith("/")) return cover;
  return `/blog-images/${slug}/${cover.replace(/\.(png|jpe?g)$/i, ".webp")}`;
}

function readFile(slug: string, lang: Locale) {
  const file = path.join(DIR, slug, `${lang}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const date = toDate(data.date);
  if (!date || !data.title) return null;
  return { data, content, date };
}

function build(slug: string, requested: Locale, now: Date): { meta: PostMeta; content: string } | null {
  let lang: Locale = requested;
  let file = readFile(slug, requested);
  if (!file && requested !== DEFAULT_LOCALE) {
    lang = DEFAULT_LOCALE;
    file = readFile(slug, DEFAULT_LOCALE);
  }
  if (!file) return null;
  if (file.data.draft === true || file.date.getTime() > now.getTime()) return null;
  const words = file.content.split(/\s+/).filter(Boolean).length;
  return {
    content: file.content,
    meta: {
      slug,
      lang,
      requested,
      title: String(file.data.title),
      description: String(file.data.description ?? ""),
      date: file.date,
      cover: coverUrl(slug, file.data.cover),
      tags: Array.isArray(file.data.tags) ? file.data.tags.map(String) : [],
      minutes: Math.max(1, Math.round(words / 210)),
      translated: lang === requested,
    },
  };
}

export function listPosts(lang: Locale, now = new Date()): PostMeta[] {
  return slugDirs()
    .map((slug) => build(slug, lang, now)?.meta)
    .filter((m): m is PostMeta => !!m)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getPost(lang: Locale, slug: string, now = new Date()): Post | null {
  if (!slugDirs().includes(slug)) return null;
  const b = build(slug, lang, now);
  if (!b) return null;
  const renderer = new marked.Renderer();
  const image = renderer.image.bind(renderer);
  renderer.image = (token) => {
    const href = token.href && !/^(https?:)?\/\//.test(token.href) && !token.href.startsWith("/") ? `/blog-images/${slug}/${token.href.replace(/\.(png|jpe?g)$/i, ".webp")}` : token.href;
    return image({ ...token, href });
  };
  const html = marked.parse(b.content, { renderer, async: false }) as string;
  return { ...b.meta, html };
}

/** Which languages a (published) post exists in - for hreflang and the language switcher. */
export function postLanguages(slug: string): Locale[] {
  return LOCALES.filter((l) => fs.existsSync(path.join(DIR, slug, `${l}.md`)));
}

export function publishedSlugs(now = new Date()): string[] {
  return slugDirs().filter((s) => build(s, DEFAULT_LOCALE, now) || LOCALES.some((l) => build(s, l, now)));
}
