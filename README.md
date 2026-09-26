# Scanabowl – owner's manual

Scanabowl is a website that gives dog and cat foods an independent score (0–100), personalised for
your pet, in **Dutch, English, German and French**, with bol.com affiliate links, a blog with scheduled
publishing, and forms for visitors and brands to send in foods.

This manual covers everything you do yourself. Nothing here needs programming – only editing
spreadsheets / text files and running a few commands.

**Contents**
1. [Run it on your computer](#1-run-it-on-your-computer)
2. [The food database](#2-the-food-database)
3. [Scraping petsplace.nl](#3-scraping-petsplacenl)
4. [Suggestions from visitors and brands](#4-suggestions-from-visitors-and-brands)
5. [Writing blog posts (and scheduling them)](#5-writing-blog-posts-and-scheduling-them)
6. [Earning from bol.com](#6-earning-from-bolcom)
7. [Putting the site online](#7-putting-the-site-online)
8. [How the score works](#8-how-the-score-works)
9. [Things you should check yourself](#9-things-you-should-check-yourself)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Run it on your computer

You need [Node.js](https://nodejs.org) (version 20 or newer; you already have it). In this folder:

```bash
npm install        # once
npm run dev        # starts the site on http://localhost:3000
```

`npm run dev` first rebuilds all food data from your `database` folder, so what you see is always
your latest data. Useful commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | run the site locally (rebuilds the data first) |
| `npm run data:build` | rebuild the food data and write `database/build-report.txt` |
| `npm run build` | build the production version (what Vercel does) |
| `npm run new-post -- "Title" 2026-11-02` | start a new blog post |
| `npm run check` | type-check + all tests + lint (run before publishing changes) |

## 2. The food database

Your database is a set of **CSV files** (Excel opens them) in the `database` folder. See
[`database/README.md`](database/README.md) for the column descriptions. In short:

* `database/scraped/` – products collected by the scraper (about 3,000 are already in there).
* `database/manual/` – products **you** type in or approve from visitors/brands. These always win over scraped rows with the same EAN.
* `database/overrides.csv` – corrections by EAN that survive re-scraping (e.g. fix one ingredient list).
* `database/images/` – product photos named `<EAN>.jpg` (optional; converted to small WebP files automatically).

After any change run `npm run data:build` (or just `npm run dev`). Open **`database/build-report.txt`**: it
lists foods with missing ingredients or analysis, suspicious scraper output and foods containing toxic
ingredients – the fastest way to see what to fix.

> Tip for Excel: save as **"CSV UTF-8 (comma delimited)"** or the Dutch **";"-delimited** version – both work.
> Keep the EAN column formatted as **text** so Excel does not turn `0064992…` into `6.4992E+10`.

Categories: a food is only scored when its category is **Volledig** (complete). Veterinary diets,
treats, supplements and complementary foods are listed but not scored, on purpose (see section 8).
The category is detected automatically from the name; set the `categorie` column yourself to override.

## 3. Scraping petsplace.nl

```bash
pip install requests beautifulsoup4 lxml     # once
python tools/scrape_petsplace.py --limit 20  # try it on 20 products
python tools/scrape_petsplace.py             # everything that is not in your database yet
```

* It follows petsplace.nl's `robots.txt` (5 seconds between pages), so a full run takes hours. Start it in the evening; stop with Ctrl+C and continue later – it remembers where it was.
* It found about **4,300 dog/cat food pages** in petsplace's sitemap; ~3,000 are already in your database.
* New rows land in `database/scraped/petsplace-<date>.csv`. Then run `npm run data:build`.
* It does **not** download product photos (they are usually the manufacturer's copyright). `--images` exists but think twice; photos supplied by brands through the brand form are the safe route.
* Scraping a shop's data is legally a grey area in the EU (database rights). Ingredients and analyses are facts printed on the pack, but it is wise to ask petsplace.nl for permission, or to use the manufacturers' own data. [Open Pet Food Facts](https://world.openpetfoodfacts.org) is an open alternative.

## 4. Suggestions from visitors and brands

Everything visitors send arrives **in your inbox**; nothing is published automatically.

| Form | Where | What you receive |
| --- | --- | --- |
| Suggest a food | `/suggest` | food details + a ready-made database row |
| Report a correction | link on every product page | which product and what is wrong |
| **For brands** | `/brands` | company details + up to 12 products, each as a database row |
| Contact | `/contact` | the message |

**To approve a submission:** copy the row from the bottom of the email ("REGELS VOOR DE DATABASE") into a
file in `database/manual/` (e.g. `ingezonden.csv` – copy `_template.csv` for the header). The `bron` column
already says `user` or `brand`, and the `opmerking` column says it still needs checking. Check the data
against the pack, run `npm run data:build`, deploy. Brand-supplied foods get the note "provided by the
manufacturer" on their page and are scored with exactly the same formula.

The forms need an email service. One-time setup:
1. Create a free account at [resend.com](https://resend.com), verify your domain `scanabowl.com`, create an API key.
2. In Vercel → Project → Settings → Environment Variables, add `RESEND_API_KEY` (the key), `MAIL_TO` (where you want the messages) and `MAIL_FROM` (e.g. `Scanabowl <noreply@scanabowl.com>`).
3. Redeploy.

Until then, the forms show a friendly "please email us instead" message with a prefilled mailto link, so nobody hits a dead end.

By default all form messages go to **scanabowl@gmail.com** (the `MAIL_TO` setting) and the same address is shown on the site as the contact address (`NEXT_PUBLIC_CONTACT_EMAIL`). Resend's free test sender only delivers to the address the Resend account was created with, so create the Resend account with scanabowl@gmail.com. To use another address later, change those two settings in Vercel.

## 5. Writing blog posts (and scheduling them)

A blog post is just a text file. To start one:

```bash
npm run new-post -- "Why cats need wet food" 2026-11-02
```

This creates `content/blog/2026-11-02-why-cats-need-wet-food/nl.md`. Open it, write in Markdown (headings
with `##`, lists with `-`, **bold**, links), put a `cover.jpg` in the same folder, and set `draft: false`.

* **Scheduling:** the `date:` line is the publish date. Put the file online any time before – the post stays invisible until that date, then appears by itself (within one hour) in the blog list, on the page, in the sitemap and in the RSS feed. For an exact time use `date: 2026-11-02T08:00:00+01:00`.
* **Keep as draft:** `draft: true` hides a post whatever its date.
* **Other languages:** add `en.md`, `de.md`, `fr.md` in the same folder (same front matter). A language that does not exist yet shows the Dutch text with a small notice.
* **Images:** `cover.jpg/png` next to the text is resized automatically. In the text: `![description](my-image.jpg)`.
* Folders that start with `_` (like `_TEMPLATE`) are never published. Look at `_TEMPLATE/nl.md` for a commented example.

> **Two of your old posts are set to `draft: true` on purpose.** Each mentions a 2025 study (a JFMS review; a
> "large-scale study" in *J Anim Physiol Anim Nutr*) that I could not verify, and the dog post has claims
> (serotonin, "leaky gut" from soy/wheat) that are not established in dogs. The `verify:` note at the top of each file says exactly what to check. Fix or remove those parts, then set `draft: false`.
> The two new example posts are fact-checked against sources listed on the methodology page; one is live, one is scheduled for 28 September 2026.

## 6. Earning from bol.com

Every product page has a **"Bekijk bij bol.com"** button (marked `rel="sponsored"`, with an affiliate
notice next to it and a full disclosure page).

1. Join the [bol.com Partnerprogramma](https://partnerprogramma.bol.com) and create a site in the Partner Platform.
2. Copy your **site id** and set `NEXT_PUBLIC_BOL_SITE_ID` in Vercel (Environment Variables), then redeploy.
3. Open one product page, click the button and compare the resulting URL with a link made in the Partner Platform's link builder – the format is in `lib/bol.ts` and is a single function to adjust if bol.com changes it.

Without a site id the button still works, it just doesn't earn commission. The button searches bol.com
by **EAN**. If you know the exact bol.com product URL of a food, put it in the `bol_url` column and that link is used instead.

## 7. Putting the site online

The site is a Next.js app that runs on **Vercel**, where scanabowl.com already lives.

```bash
npx vercel login        # once, with your Vercel account
npx vercel link         # once: choose your existing scanabowl project
npx vercel --prod       # publish
```

* In the Vercel project settings, set **Framework Preset = Next.js** (the old site was plain static files).
* Add the environment variables from `.env.example` (`RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM`, `NEXT_PUBLIC_BOL_SITE_ID`, `NEXT_PUBLIC_KVK`, `NEXT_PUBLIC_VAT`, `NEXT_PUBLIC_ADDRESS`).
* The build automatically regenerates all food data from `database/`, so you only edit CSV files and publish.
* The old site read its data from a Google Sheet; that is no longer used. You can leave the sheet alone or delete it.
* Every product page is created the first time somebody visits it and then cached; the food list and search are instant because they use small pre-built files.

**Fill in your company details** (KvK, BTW-id, address) via the `NEXT_PUBLIC_…` variables. Dutch law requires them on a business website; they appear in the footer and legal pages once set.

### Vercel plan and usage

* The free **Hobby** plan is for non-commercial use only and pauses the whole account when a monthly limit is exceeded (this happened on 2026-09-26: "ISR Writes" reached 129 %). Scanabowl earns affiliate income, so run it on the **Pro** plan.
* "ISR writes" are the pages the server renders after a deployment and stores; they are counted in 8 KB units. Three things keep them low, and `tests/sitemap.test.ts` guards the last one:
  * pages stay light - never pass big data (such as the whole translation file) from a server component to a client component; translations are bundled inside `components/i18n/providers/`;
  * no timestamps (`new Date()`) in pages or the sitemap - output that changes on every refresh is stored again every time;
  * `sitemap.xml` is built once per deployment; only the small `sitemap-blog.xml` refreshes hourly.
* In Vercel, **Project -> Firewall -> Bot Protection** can additionally challenge unverified bots. `robots.txt` already asks SEO scanners to stay away.

## 8. How the score works

The full explanation, with scientific sources, is on the website at **`/nl/how-we-score`** (also in EN/DE/FR).
In short: **35 points nutrient profile** (compared with the FEDIAF 2021 nutritional guidelines, on a
dry-matter and per-1,000-kcal basis), **50 points ingredient quality** (where the protein comes from,
animal share of the dry matter, named vs. vague sources), **15 points clean formulation** (deductions for
sugar, colourants, synthetic preservatives, filler). Toxic ingredients cap the score at 25.
Dogs and cats are scored differently (e.g. moisture and carbohydrates matter for cats).

For developers / future changes see [`docs/SCORING.md`](docs/SCORING.md). Every rule has a unit test
(`npm test`); if you change a weight, the report script shows how the whole database shifts:

```bash
npx tsx scripts/score-report.ts --pillars --samples
```

Honest limits, which the site itself states: a label-based score cannot see digestibility, manufacturing
quality control or feeding-trial evidence (WSAVA), and it does not replace a vet. Prescription diets,
treats, supplements and complementary foods are deliberately not scored.

## 9. Things you should check yourself

* **Legal pages** (privacy, terms, affiliate disclosure) are solid drafts, not legal advice. Have them read once by someone qualified, and fill in your company details.
* **The blog drafts** (section 5).
* **Grade wording.** Foods from well-known brands can score low on an ingredient-based method (e.g. wheat- or by-product-heavy recipes). The score describes the *label*, and the site says so, but if a brand disputes a score, the fix is in the data (a correction), not in the formula. Consider whether "Weak" (grade E) suits your risk appetite.
* **Data accuracy.** About 160 scraped foods have suspicious ingredient text and ~60 have none (see `database/build-report.txt`); ~340 have no analysis, which lowers their reliability rating rather than their score much.
* **Photos.** Only ~145 foods have a photo; others show a neutral bowl icon.
* **Scraping permission** (section 3).

## 10. Troubleshooting

| Problem | Fix |
| --- | --- |
| A food is missing from the list | check `database/build-report.txt`; it needs a valid EAN or name, a dog/cat value and – to be scored – an ingredient list and category "Volledig" |
| A food has the wrong type (dry/wet) | set `voertype` in the CSV (it is trusted as typed) |
| Score looks wrong | open the product page → "Wat kan beter/goed" explains it. Fix wrong ingredient/analysis text in the database |
| Barcode scanner does nothing | camera needs HTTPS (fine on scanabowl.com) and permission; typing the EAN always works |
| Form says "we could not send" | `RESEND_API_KEY` is missing or the sender domain is not verified in Resend |
| Blog post not visible | check `draft: false`, the `date`, and wait up to an hour after the date passes |

Project layout: `app/` pages · `components/` UI · `lib/scoring/` the score engine · `lib/catalog/` cleaning
of database rows · `messages/` all texts in 4 languages (`nl.json`, `en.json`, `de.json`, `fr.json`) ·
`content/blog/` posts · `database/` your data · `scripts/` build tools · `tools/` scraper · `tests/`.
To change a text on the site, edit it in **all four** `messages/*.json` files – `npm test` fails if a language is missing a key.
