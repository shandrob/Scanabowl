import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import DeProvider from "./providers/de";
import EnProvider from "./providers/en";
import FrProvider from "./providers/fr";
import NlProvider from "./providers/nl";

const PROVIDERS: Record<Locale, (props: { children: ReactNode }) => ReactNode> = {
  nl: NlProvider,
  en: EnProvider,
  de: DeProvider,
  fr: FrProvider,
};

/** Server-side switch: picks the client provider that carries this language's dictionary. */
export function LocaleProvider({ lang, children }: { lang: Locale; children: ReactNode }) {
  const Provider = PROVIDERS[lang];
  return <Provider>{children}</Provider>;
}
