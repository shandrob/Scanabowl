#!/usr/bin/env python3
"""
Scrapes dog and cat FOOD product data from petsplace.nl into the Scanabowl database format.

    python tools/scrape_petsplace.py                 # everything that is not in the database yet
    python tools/scrape_petsplace.py --limit 20      # try it out on 20 products
    python tools/scrape_petsplace.py --refresh       # also re-fetch products you already have

What it does
  1. Reads the product sitemap of petsplace.nl and keeps the dog/cat food pages.
  2. Skips products whose EAN is already in database/scraped or database/manual.
  3. Opens each page and reads the data the shop itself embeds in the page:
     name, brand, EAN, composition (ingredients), analytical constituents, food type, life stage,
     pack size and price.
  4. Appends every product to database/scraped/petsplace-<date>.csv - immediately, so you can
     stop at any time and continue later (the script remembers what it has done).

Being a good guest
  - It follows robots.txt of petsplace.nl, including its Crawl-delay (5 seconds between pages).
    A full run therefore takes hours; that is intended. Run it in the evening.
  - It identifies itself with a User-Agent that names Scanabowl.
  - It never downloads product photos unless you pass --images, because photos are usually
    copyrighted by the manufacturer. Prefer photos from the brand itself (see the brand form).

After scraping, run `npm run data:build` to score the new products. Products with a missing
ingredient list are listed in database/build-report.txt.

Requires:  pip install requests beautifulsoup4 lxml
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import random
import re
import sys
import time
import urllib.robotparser
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "database"
BASE = "https://www.petsplace.nl"
SITEMAP_INDEX = f"{BASE}/media/ijsvogel_nl/siteindex.xml"
USER_AGENT = "Mozilla/5.0 (compatible; ScanabowlBot/1.0; +https://www.scanabowl.com)"
FOOD_URL = re.compile(r"(kattenvoer|hondenvoer|kattendieetvoer|hondendieetvoer|kattenbrokken|hondenbrokken)", re.I)
COLUMNS = [
    "ean", "naam", "merk", "doeldier", "voertype", "levensfase", "categorie", "ingredienten",
    "analyse", "verpakking", "prijs", "bol_url", "afbeelding", "bron", "url", "opmerking",
]


def log(msg: str) -> None:
    print(msg, flush=True)


def canonical_url(url: str) -> str:
    """Drop the ?size=... variant parameters: they point at the same product page."""
    p = urlsplit(url.strip())
    return urlunsplit((p.scheme, p.netloc, p.path, "", ""))


def ean_from_url(url: str) -> str:
    m = re.search(r"-(\d{8,14})-pps", url)
    return m.group(1) if m else ""


def load_known_eans() -> set[str]:
    known: set[str] = set()
    for folder in ("scraped", "manual"):
        for f in (DB / folder).glob("*.csv"):
            try:
                with open(f, encoding="utf-8-sig", newline="") as fh:
                    # decide the delimiter from the header line only: ingredient lists are full of commas
                    header = fh.readline()
                    fh.seek(0)
                    delim = ";" if header.count(";") > header.count(",") else ","
                    for row in csv.DictReader(fh, delimiter=delim):
                        e = re.sub(r"\D", "", row.get("ean", "") or "")
                        if e:
                            known.add(e.zfill(13))
            except Exception as exc:  # noqa: BLE001
                log(f"  (could not read {f.name}: {exc})")
    return known


def gap_eans() -> set[str]:
    """EANs of foods whose ingredient list or analysis is missing, according to the last `npm run data:build`."""
    gaps: set[str] = set()
    for f in (ROOT / "data" / "generated").glob("products.*.json"):
        for p in json.loads(f.read_text(encoding="utf-8")):
            unusable = p.get("notScored") in ("no_ingredients", "ingredients_unclear")
            if p.get("ean") and p.get("category") == "complete" and (unusable or not p.get("analysisText")):
                gaps.add(str(p["ean"]).zfill(13))
    return gaps


def polite_session(rp: urllib.robotparser.RobotFileParser) -> tuple[requests.Session, float]:
    s = requests.Session()
    s.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "nl-NL,nl;q=0.9"})
    delay = rp.crawl_delay(USER_AGENT) or rp.crawl_delay("*") or 5
    return s, max(float(delay), 5.0)


def fetch(session: requests.Session, url: str, tries: int = 3) -> str | None:
    for attempt in range(1, tries + 1):
        try:
            r = session.get(url, timeout=40)
            if r.status_code == 200:
                r.encoding = r.encoding or "utf-8"
                return r.text
            if r.status_code in (404, 410):
                return None
            log(f"  HTTP {r.status_code} for {url} (try {attempt})")
        except requests.RequestException as exc:
            log(f"  network problem: {exc} (try {attempt})")
        time.sleep(10 * attempt)
    return None


def sitemap_product_urls(session: requests.Session, delay: float) -> list[str]:
    log("Reading the sitemap of petsplace.nl ...")
    idx = fetch(session, SITEMAP_INDEX)
    if not idx:
        sys.exit("Could not read the sitemap index. Try again later.")
    maps = [m.strip() for m in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", idx) if "products_" in m]
    urls: dict[str, None] = {}
    for m in maps:
        time.sleep(delay)
        xml = fetch(session, m)
        if not xml:
            continue
        for u in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml):
            if FOOD_URL.search(u):
                urls[canonical_url(u)] = None
    log(f"  {len(urls)} dog/cat food pages found")
    return list(urls)


def embedded_attributes(html: str) -> dict[str, str]:
    """The shop embeds its product attributes as JSON ("additionalAttr") in the page."""
    i = html.find('"additionalAttr":')
    if i < 0:
        return {}
    j = html.find("{", i)
    depth = 0
    for k in range(j, len(html)):
        if html[k] == "{":
            depth += 1
        elif html[k] == "}":
            depth -= 1
            if depth == 0:
                try:
                    data = json.loads(html[j : k + 1])
                except json.JSONDecodeError:
                    return {}
                return {code: str(v.get("value", "")).strip() for code, v in data.items() if isinstance(v, dict)}
    return {}


def json_ld_product(soup: BeautifulSoup) -> dict:
    for sc in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(sc.string or "")
        except json.JSONDecodeError:
            continue
        items = data if isinstance(data, list) else [data]
        for d in items:
            if isinstance(d, dict) and d.get("@type") == "Product":
                return d
    return {}


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").replace("\x1f", "")).strip()


def attribute_table(soup: BeautifulSoup) -> dict[str, str]:
    """Since 2026 the shop shows its product data in a table: <td data-td="Samenstelling">...</td>."""
    out: dict[str, str] = {}
    for td in soup.select("td[data-td]"):
        label = clean(td.get("data-td") or "")
        if label and label not in out:
            out[label] = clean(td.get_text(" ", strip=True))
    return out


def parse_product(html: str, url: str) -> dict[str, str] | None:
    soup = BeautifulSoup(html, "lxml")
    table = attribute_table(soup)
    # the old embedded JSON is still read as a fallback; the table wins when both exist
    attrs = embedded_attributes(html)
    for key, label in (
        ("ean", "EAN"),
        ("brd", "Merk"),
        ("productcompositionword", "Samenstelling"),
        ("productcompositionanalysis", "Analyse"),
        ("product_group", "Productgroep"),
        ("stg1", "Soort of Levensfase"),
        ("wgt", "Gewicht"),
    ):
        if table.get(label):
            attrs[key] = table[label]
    ld = json_ld_product(soup)
    ean = attrs.get("ean") or str(ld.get("gtin13") or "") or ean_from_url(url)
    name = clean(str(ld.get("name") or ""))
    if not name and soup.title:
        name = clean(soup.title.get_text().split("|")[0])
    name = re.sub(r"\s*[-|]\s*Pets ?Place\s*$", "", name, flags=re.I)
    if not name:
        return None
    slug = url.lower()
    species = "Kat" if ("katten" in slug or "kattendieet" in slug) else "Hond" if "honden" in slug else ""
    price = ""
    offers = ld.get("offers")
    if isinstance(offers, dict):
        price = str(offers.get("price") or "")
    elif isinstance(offers, list) and offers and isinstance(offers[0], dict):
        price = str(offers[0].get("price") or "")
    brand = attrs.get("brd") or ""
    if not brand and isinstance(ld.get("brand"), dict):
        brand = str(ld["brand"].get("name") or "")
    group = attrs.get("product_group", "")
    life = attrs.get("stg1") or attrs.get("stg2") or ""
    return {
        "ean": ean,
        "naam": name,
        "merk": clean(brand),
        "doeldier": species,
        "voertype": group,  # "Droogvoer", "Natvoer", "Diepvriesvoer", "Apotheek", ...
        "levensfase": life,
        "categorie": "",
        "ingredienten": clean(attrs.get("productcompositionword", "")),
        "analyse": clean(attrs.get("productcompositionanalysis", "")),
        "verpakking": clean(attrs.get("wgt", "")),
        "prijs": price,
        "bol_url": "",
        "afbeelding": "",
        "bron": "scraped",
        "url": url,
        "opmerking": "",
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Scrape dog/cat food data from petsplace.nl (polite, resumable)")
    ap.add_argument("--limit", type=int, default=0, help="stop after N products (0 = no limit)")
    ap.add_argument("--refresh", action="store_true", help="also re-fetch products that are already in the database")
    ap.add_argument("--fill-gaps", action="store_true", help="also re-fetch products in the database that have no ingredient list or analysis")
    ap.add_argument("--images", action="store_true", help="also download product photos (mind the copyright!)")
    ap.add_argument("--out", default="", help="output CSV (default: database/scraped/petsplace-<today>.csv)")
    args = ap.parse_args()

    rp = urllib.robotparser.RobotFileParser(f"{BASE}/robots.txt")
    rp.read()
    session, delay = polite_session(rp)
    log(f"robots.txt read - waiting {delay:.0f} s between requests, as the site asks.")

    out = Path(args.out) if args.out else DB / "scraped" / f"petsplace-{dt.date.today().isoformat()}.csv"
    state = out.with_suffix(".done.txt")
    out.parent.mkdir(parents=True, exist_ok=True)
    done = set(state.read_text(encoding="utf-8").split()) if state.exists() else set()
    known = set() if args.refresh else load_known_eans()
    if args.fill_gaps:
        gaps = gap_eans()
        known -= gaps
        log(f"  {len(gaps)} products in the database miss ingredients or analysis - they are fetched again")

    urls = sitemap_product_urls(session, delay)
    todo = []
    for u in urls:
        e = ean_from_url(u)
        if u in done or (e and e.zfill(13) in known):
            continue
        if not rp.can_fetch(USER_AGENT, u):
            continue
        todo.append(u)
    random.shuffle(todo)  # spreads the load and gives a representative sample early on
    if args.limit:
        todo = todo[: args.limit]
    log(f"{len(todo)} products to fetch (about {len(todo) * delay / 3600:.1f} hours). Press Ctrl+C to stop; run again to continue.")

    new_file = not out.exists()
    fh = open(out, "a", encoding="utf-8-sig", newline="")
    writer = csv.DictWriter(fh, fieldnames=COLUMNS, delimiter=";", quoting=csv.QUOTE_ALL)
    if new_file:
        writer.writeheader()
    ok = missing = 0
    try:
        for n, url in enumerate(todo, 1):
            time.sleep(delay + random.uniform(0, 1.5))
            html = fetch(session, url)
            if html is None:
                log(f"[{n}/{len(todo)}] skipped (not available): {url}")
                done.add(url)
                continue
            row = parse_product(html, url)
            if row is None:
                log(f"[{n}/{len(todo)}] no product data: {url}")
                done.add(url)
                continue
            if args.images and row["ean"]:
                img = BeautifulSoup(html, "lxml").find("meta", property="og:image")
                if img and img.get("content"):
                    try:
                        data = session.get(img["content"], timeout=40).content
                        (DB / "images").mkdir(exist_ok=True)
                        (DB / "images" / f"{row['ean'].zfill(13)}.jpg").write_bytes(data)
                    except requests.RequestException:
                        pass
            writer.writerow(row)
            fh.flush()
            done.add(url)
            state.write_text("\n".join(sorted(done)), encoding="utf-8")
            if row["ingredienten"]:
                ok += 1
            else:
                missing += 1
            log(f"[{n}/{len(todo)}] {row['merk']} - {row['naam'][:60]}" + ("" if row["ingredienten"] else "   (no ingredients on the page)"))
    except KeyboardInterrupt:
        log("Stopped. Run the script again to continue where you left off.")
    finally:
        fh.close()
    log(f"Done: {ok} products with ingredients, {missing} without. Saved in {out}")
    log("Next: npm run data:build")


if __name__ == "__main__":
    main()
