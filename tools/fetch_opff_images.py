"""
Fetch product photos from Open Pet Food Facts (https://world.openpetfoodfacts.org) for foods that have no photo yet.

Open Pet Food Facts photos are published under the Creative Commons Attribution-ShareAlike licence (CC BY-SA 3.0),
which allows use on a commercial site as long as the source is credited. The website shows that credit under
every photo that came from here; the credit is read from database/image-credits.csv, which this script fills.

    python tools/fetch_opff_images.py            # check every food without a photo (about 1 request per second)
    python tools/fetch_opff_images.py --limit 50 # try it on 50 foods

It is safe to stop (Ctrl+C) and start again: barcodes that were already looked up are remembered in
tools/opff-checked.txt and skipped, so a later run only asks about new foods. Afterwards run `npm run data:build`.
Uses only the Python standard library.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "database" / "images"
CREDITS = ROOT / "database" / "image-credits.csv"
CHECKED = ROOT / "tools" / "opff-checked.txt"
PRODUCTS = [ROOT / "data" / "generated" / "products.dog.json", ROOT / "data" / "generated" / "products.cat.json"]

API = "https://world.openpetfoodfacts.org/api/v2/product/{ean}.json?fields=code,image_front_url,image_url"
HEADERS = {"User-Agent": "Scanabowl/1.0 (scanabowl@gmail.com) photo sync"}
# Open Food Facts asks for at most 100 product reads per minute
DELAY = 0.75
CREDIT_COLUMNS = ["ean", "bron", "licentie", "url"]


def get(url: str, timeout: int = 30) -> bytes | None:
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code == 429 or e.code >= 500:
                time.sleep(10 * (attempt + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            time.sleep(5 * (attempt + 1))
    return None


def load_checked() -> set[str]:
    if not CHECKED.exists():
        return set()
    return {line.split(";")[0].strip() for line in CHECKED.read_text(encoding="utf-8").splitlines() if line.strip() and not line.startswith("#")}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--limit", type=int, default=0, help="stop after this many look-ups")
    args = ap.parse_args()

    if not all(p.exists() for p in PRODUCTS):
        print("Run `npm run data:build` first (it creates data/generated/).")
        return 1
    products = [p for f in PRODUCTS for p in json.loads(f.read_text(encoding="utf-8"))]
    have_photo = {f.stem for f in IMAGES.iterdir() if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}}
    checked = load_checked()
    todo = sorted({p["ean"] for p in products if p.get("ean") and p["ean"] not in have_photo and p["ean"] not in checked})
    if args.limit:
        todo = todo[: args.limit]
    print(f"{len(products)} foods, {len(have_photo)} with a photo, {len(checked)} looked up before -> {len(todo)} to look up")

    new_credits = CREDITS.exists()
    if not CHECKED.exists():
        CHECKED.write_text("# barcodes already looked up on Open Pet Food Facts (barcode;date;result) - delete a line to look it up again\n", encoding="utf-8")
    found = 0
    with CREDITS.open("a", encoding="utf-8", newline="") as cf, CHECKED.open("a", encoding="utf-8") as kf:
        writer = csv.writer(cf, delimiter=";")
        if not new_credits:
            writer.writerow(CREDIT_COLUMNS)
        for i, ean in enumerate(todo, 1):
            result = "none"
            raw = get(API.format(ean=ean))
            if raw:
                data = json.loads(raw)
                prod = data.get("product") or {}
                img_url = prod.get("image_front_url") or prod.get("image_url")
                if data.get("status") == 1 and img_url:
                    img = get(img_url, timeout=60)
                    if img and len(img) > 2000:
                        (IMAGES / f"{ean}.jpg").write_bytes(img)
                        writer.writerow([ean, "Open Pet Food Facts", "CC BY-SA 3.0", f"https://world.openpetfoodfacts.org/product/{ean}"])
                        cf.flush()
                        found += 1
                        result = "photo"
            kf.write(f"{ean};{dt.date.today().isoformat()};{result}\n")
            kf.flush()
            if i % 100 == 0:
                print(f"  {i}/{len(todo)} looked up, {found} photos found")
            time.sleep(DELAY)
    print(f"done: {found} new photos. Now run `npm run data:build`.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
