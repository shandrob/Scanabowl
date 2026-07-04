# Scanabowl — Deployment & Sync Manual

Your stack: **GitHub Pages (free hosting) + Google Sheets (free database) + Papa Parse (free CSV parsing)**. Total cost: €0/month.

---

## 1 · Save the files locally

Place these three files directly in your project folder:

```
C:\Users\Shandro\Projects\Scanabowl\
├── index.html
├── style.css
├── script.js
└── CNAME          ← already exists — DO NOT delete or overwrite this
```

If you download them elsewhere first, move them in with File Explorer, or via PowerShell:

```powershell
Move-Item "$env:USERPROFILE\Downloads\index.html" "C:\Users\Shandro\Projects\Scanabowl\" -Force
Move-Item "$env:USERPROFILE\Downloads\style.css"  "C:\Users\Shandro\Projects\Scanabowl\" -Force
Move-Item "$env:USERPROFILE\Downloads\script.js"  "C:\Users\Shandro\Projects\Scanabowl\" -Force
```

**Test locally before pushing.** Don't just double-click index.html (the `file://` protocol can behave oddly with fetches). Instead, run a tiny local server:

```powershell
cd C:\Users\Shandro\Projects\Scanabowl
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser. (No Python? `npx serve` works too.)

---

## 2 · Commit & push to GitHub — without breaking your domain

Your custom domain works because of the `CNAME` file in the repo root (it contains one line: `scanabowl.com`). The commands below **add** the new files and never touch CNAME.

```powershell
cd C:\Users\Shandro\Projects\Scanabowl

# 1. Verify CNAME is still there and intact — should print: scanabowl.com
type CNAME

# 2. Check what changed
git status

# 3. Stage the three files explicitly (never use a destructive clean/reset)
git add index.html style.css script.js

# 4. Commit
git commit -m "Rebuild: premium pet-tech redesign with Sheets database, wizard & blog"

# 5. Push to the branch GitHub Pages serves from (usually main)
git push origin main
```

Safety rules for CNAME:

- **Never** run `git rm CNAME` or delete it in File Explorer.
- If you ever wipe/recreate the folder, recreate CNAME first: `echo scanabowl.com > CNAME` (make sure it saves without a file extension).
- After pushing, verify in the GitHub repo → Settings → Pages that "Custom domain" still shows `scanabowl.com` and "Enforce HTTPS" is checked.

Deployment takes 1–3 minutes after the push. Hard-refresh with **Ctrl+F5** to bypass your browser cache.

---

## 3 · Google Sheets: required sharing setting + column headers

### Sharing (critical!)
The site fetches the CSV exports directly from the browser. This only works if the spreadsheet is public: in Google Sheets → **Share → General access → "Anyone with the link" → Viewer**. If you see the red error banner on the site, this setting is the #1 suspect.

### Column headers
The parser accepts **Dutch or English** headers (case-insensitive) and both `12,5` and `12.5` decimals. Use these exact names for a guaranteed match:

**Products tab (gid=0)** — one row per food:

| Header | Example | Notes |
|---|---|---|
| `name` (or `naam`) | Adult Kip & Rijst 12kg | required |
| `brand` (or `merk`) | Prins | |
| `animal` (or `dier`) | Hond / Kat | drives the animal filter |
| `type` | Droogvoer / Natvoer | drives moisture assumption (10% dry, 78% wet) |
| `life_stage` (or `levensfase`) | Puppy / Adult / Senior | |
| `grain_free` (or `graanvrij`) | TRUE / FALSE | also accepts ja/nee, 1/0 |
| `protein` (or `eiwit`) | 26 | % as-fed |
| `fat` (or `vet`) | 15 | % |
| `ash` (or `as`) | 7,5 | % |
| `fiber` (or `vezel`) | 2,8 | % |
| `moisture` (or `vocht`) | 10 | %, optional — estimated if empty |
| `carbs` (or `koolhydraten`) | | optional — **auto-calculated if empty** |
| `kcal` | 3650 → enter as kcal per 100g e.g. 365 | optional — estimated via Atwater if empty |
| `weight_kg` (or `gewicht`) | 12 | package weight in kg — needed for daily cost |
| `price` (or `prijs`) | 54,99 | in € — needed for daily cost |
| `score` | 8,7 | your 0–10 rating |
| `ingredients` (or `ingredienten`) | Kip (26%), rijst, maïs, … | comma-separated; first 5 are bolded |
| `image` (or `afbeelding`) | https://… | direct image URL, optional |
| `url` | https://partner.bol.com/… | **your unique Bol.com affiliate redirect link** |
| `description` (or `beschrijving`) | Korte productomschrijving | optional |

**Blogs tab (gid=966661590):** `title`, `slug` (optional, auto-generated from title), `excerpt`, `content`, `image`, `author`, `date`, `tags`. In `content` you can use lightweight formatting: `## Heading`, `### Subheading`, `**bold**`, `*italic*`, and lines starting with `- ` for bullet lists. Blank lines create paragraphs.

**Brands tab (gid=898173781):** `name` (or `merk`), plus optional `logo`, `description`, `website`. The brand filter merges this list with brands found in Products, so nothing breaks if a brand is missing here.

**Pet Profiles tab (gid=1151312816):** optional wizard configuration with three columns: `group`, `label`, `value`. Supported groups: `activity` (extra activity levels) and `allergy` (extra allergy options, e.g. group=`allergy`, label=`Lam`, value=`lam`). If this tab is empty or malformed, the wizard silently falls back to sensible built-in defaults — the site never breaks.

### Sync behavior
There is **no build step**. Edit a cell in Sheets → save → visitors see it on the next page load (Google's CSV export may cache for a few minutes). You only push to GitHub when you change the code itself.

---

## 4 · Manual tasks checklist (do these yourself)

### Legal & business (required for Bol.com approval)
- [ ] In `index.html`, replace `[KvK-nummer invullen]` and `[BTW-id invullen]` in the footer with your real Chamber of Commerce and VAT numbers.
- [ ] In `script.js`, do the same in the `LEGAL` section (privacy + voorwaarden pages contain the placeholders too), and fill in the `[datum invullen]` last-updated dates.
- [ ] Set up the `info@scanabowl.com` mailbox (or change the address in both files to one you actually read).

### Content (Bol.com wants a real, content-rich site)
- [ ] Write **at least 10 substantive blog posts** in the Blogs tab (aim for 500+ words each). Good topics: how to read a pet food label, grain-free pros and cons, puppy vs. adult nutrition needs, wet vs. dry food, common allergens in dogs, feline protein requirements, transitioning to a new food, understanding "analytische bestanddelen", how we calculate daily cost, senior pet nutrition.
- [ ] Fill the Products tab with at least 20–30 real products, complete with ingredients and macros from the actual packaging.
- [ ] Add product images (use image URLs you have the right to use — e.g. images provided through the Bol.com partner platform).

### Bol.com Partnerprogramma
- [ ] Register at partnerprogramma.bol.com with scanabowl.com as your site.
- [ ] Once approved, generate your unique affiliate/redirect links per product and paste them into the `url` column of the Products sheet. Until then, leaving `url` empty is safe — the CTA button simply doesn't render for that product.
- [ ] Keep the affiliate disclaimer visible (it's in the footer, the modal CTA, and its own page — don't remove it; Bol.com checks for this).

### Verification
- [ ] Google Sheet shared as "Anyone with the link → Viewer".
- [ ] Site loads at https://scanabowl.com with a green padlock (HTTPS).
- [ ] Open a product → modal shows the macro chart, bolded top-5 ingredients, and daily cost.
- [ ] Complete the wizard → recommendations appear and the Finder shows the profile banner.
- [ ] Test on your phone (mobile menu, filters toggle, modal scrolling).

---

## 5 · How it all fits together

```
Google Sheets (you edit)          GitHub Pages (static, free)
   │  public CSV export                 │  serves index.html + css + js
   ▼                                    ▼
Papa Parse (in visitor's browser) ──► renders Finder, Wizard, Blog, Modals
   │
   └─► Pet profile → localStorage (visitor's own browser, nothing sent anywhere)
```

No servers, no databases to maintain, no monthly bills. Update content in Sheets; update code with a git push.
