"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Species } from "../scoring/types";

/**
 * The comparison list ("compare these foods") lives in the visitor's browser only, like the pet profile.
 * One list per species: comparing a dog food with a cat food makes no sense.
 */

export const MAX_COMPARE = 3;
const KEY = "scanabowl.compare.v1";

export type CompareState = Record<Species, string[]>;

const EMPTY: CompareState = { dog: [], cat: [] };
let cache: CompareState | null = null;
const listeners = new Set<() => void>();

function clean(ids: unknown): string[] {
  return Array.isArray(ids) ? [...new Set(ids.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length < 40))].slice(0, MAX_COMPARE) : [];
}

function read(): CompareState {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<CompareState> | null;
    return (cache = parsed ? { dog: clean(parsed.dog), cat: clean(parsed.cat) } : EMPTY);
  } catch {
    return (cache = EMPTY);
  }
}

function write(next: CompareState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / blocked storage: the list lasts for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCompare() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);
  const set = useCallback((species: Species, ids: string[]) => write({ ...read(), [species]: clean(ids) }), []);
  const toggle = useCallback((species: Species, id: string) => {
    const cur = read()[species];
    if (cur.includes(id)) write({ ...read(), [species]: cur.filter((x) => x !== id) });
    // a full list drops its oldest food: the newest choice always gets in
    else write({ ...read(), [species]: [...cur, id].slice(-MAX_COMPARE) });
  }, []);
  return { lists: state, set, toggle };
}
