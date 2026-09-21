"use client";

import type { Species } from "../scoring/types";
import type { IndexEntry } from "./types";

const cache = new Map<Species, Promise<IndexEntry[]>>();

/** Fetches the slim product index for one species (cached for the whole visit). */
export function loadIndex(species: Species): Promise<IndexEntry[]> {
  let p = cache.get(species);
  if (!p) {
    p = fetch(`/data/index.${species}.json`, { cache: "force-cache" }).then((r) => {
      if (!r.ok) throw new Error(`index ${species}: ${r.status}`);
      return r.json() as Promise<IndexEntry[]>;
    });
    p.catch(() => cache.delete(species));
    cache.set(species, p);
  }
  return p;
}
