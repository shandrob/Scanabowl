/**
 * Create a new blog post from the template.
 *
 *   npm run new-post -- "Title of the post" 2026-11-02
 *
 * Creates content/blog/2026-11-02-title-of-the-post/nl.md (as a draft) - open it, write, and set
 * `draft: false`. The post goes live by itself on the date you chose.
 */
import fs from "node:fs";
import path from "node:path";
import { slugify } from "../lib/catalog/clean";

const ROOT = path.resolve(__dirname, "..");
const [title, dateArg] = process.argv.slice(2);
if (!title) {
  console.log('Usage: npm run new-post -- "Title of the post" [YYYY-MM-DD]');
  process.exit(1);
}
const date = dateArg && /^\d{4}-\d{2}-\d{2}$/.test(dateArg) ? dateArg : new Date().toISOString().slice(0, 10);
const slug = `${date}-${slugify(title).slice(0, 60)}`;
const dir = path.join(ROOT, "content", "blog", slug);
if (fs.existsSync(dir)) {
  console.error(`Already exists: content/blog/${slug}`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });
let text = fs.readFileSync(path.join(ROOT, "content", "blog", "_TEMPLATE", "nl.md"), "utf8");
text = text.replace(/^title: .*$/m, `title: ${JSON.stringify(title)}`).replace(/^date: .*$/m, `date: ${date}`);
fs.writeFileSync(path.join(dir, "nl.md"), text, "utf8");
console.log(`Created content/blog/${slug}/nl.md`);
console.log("Next: write the text, add cover.jpg to the same folder, and set `draft: false` to publish on", date);
