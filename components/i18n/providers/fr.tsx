"use client";

import type { ReactNode } from "react";
import type { Messages } from "@/lib/i18n/t";
import dict from "@/messages/fr.json";
import { DictionaryProvider } from "../DictionaryProvider";

/**
 * The dictionary is imported here, inside a client module, so it ships as a cached JavaScript file
 * instead of being copied into the HTML of every single page (that made each page ~50 KB heavier).
 */
export default function FrProvider({ children }: { children: ReactNode }) {
  return (
    <DictionaryProvider lang="fr" dict={dict as unknown as Messages}>
      {children}
    </DictionaryProvider>
  );
}
