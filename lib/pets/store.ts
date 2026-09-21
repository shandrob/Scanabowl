"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PetProfile } from "../scoring/types";

/**
 * Pet profiles live only in the visitor's browser (localStorage). Nothing is sent to a server:
 * that is a privacy promise the site makes and the reason no cookie banner is needed.
 */

const KEY = "scanabowl.pets.v1";

interface State {
  pets: PetProfile[];
  activeId: string | null;
}

const EMPTY: State = { pets: [], activeId: null };
let cache: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return (cache = EMPTY);
    const parsed = JSON.parse(raw) as State;
    if (!Array.isArray(parsed.pets)) return (cache = EMPTY);
    return (cache = { pets: parsed.pets.map(normalizePet), activeId: parsed.activeId ?? parsed.pets[0]?.id ?? null });
  } catch {
    return (cache = EMPTY);
  }
}

function write(next: State) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota: the profile just lasts for this visit */
  }
  listeners.forEach((l) => l());
}

function normalizePet(p: PetProfile): PetProfile {
  return {
    ...p,
    allergens: Array.isArray(p.allergens) ? p.allergens : [],
    customAllergens: Array.isArray(p.customAllergens) ? p.customAllergens : [],
    strictAllergies: p.strictAllergies !== false,
  };
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

export function newPetId(): string {
  return `pet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function usePets() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);
  const active = state.pets.find((p) => p.id === state.activeId) ?? state.pets[0] ?? null;

  const save = useCallback((pet: PetProfile) => {
    const cur = read();
    const exists = cur.pets.some((p) => p.id === pet.id);
    const pets = exists ? cur.pets.map((p) => (p.id === pet.id ? pet : p)) : [...cur.pets, pet];
    write({ pets, activeId: pet.id });
  }, []);
  const remove = useCallback((id: string) => {
    const cur = read();
    const pets = cur.pets.filter((p) => p.id !== id);
    write({ pets, activeId: cur.activeId === id ? (pets[0]?.id ?? null) : cur.activeId });
  }, []);
  const setActive = useCallback((id: string) => {
    write({ ...read(), activeId: id });
  }, []);

  return { pets: state.pets, active, save, remove, setActive };
}
