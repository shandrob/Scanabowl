"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { IconChevron, IconGlobe, IconMenu, IconPaw, IconX } from "@/components/ui/Icons";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, localePath, stripLocale } from "@/lib/i18n/config";
import { usePets } from "@/lib/pets/store";

function rememberLanguage(l: string) {
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

const NAV = [
  { href: "/foods", key: "nav.foods" },
  { href: "/my-pet", key: "nav.myPet" },
  { href: "/blog", key: "nav.blog" },
  { href: "/how-we-score", key: "nav.howWeScore" },
] as const;

export function Header() {
  const t = useT();
  const lang = useLang();
  const pathname = usePathname();
  const rest = stripLocale(pathname);
  const { active } = usePets();
  // the mobile menu closes by itself when the page changes: remember *where* it was opened
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!langOpen) return;
    const close = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setLangOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [langOpen]);

  const isActive = (href: string) => rest === href || rest.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href={localePath(lang)} className="flex items-center gap-2.5" aria-label="Scanabowl">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-xl" priority />
          <span className="font-display text-xl font-semibold tracking-tight text-brand-deep">Scanabowl</span>
        </Link>

        <nav aria-label={t("nav.main")} className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={localePath(lang, n.href)}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-[0.95rem] font-medium transition-colors hover:bg-brand-soft/60 hover:text-brand-deep ${
                isActive(n.href) ? "bg-brand-soft/70 text-brand-deep" : "text-ink-soft"
              }`}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={localePath(lang, "/my-pet")}
            className="hidden items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink shadow-sm transition hover:border-brand-mid sm:inline-flex"
          >
            <IconPaw className="h-4 w-4 text-brand-mid" />
            {active ? <span className="max-w-[9ch] truncate">{active.name}</span> : <span>{t("nav.addPet")}</span>}
          </Link>

          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              aria-label={t("nav.language")}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink shadow-sm transition hover:border-brand-mid"
            >
              <IconGlobe className="h-4 w-4 text-ink-faint" />
              <span className="uppercase">{lang}</span>
              <IconChevron className={`h-3.5 w-3.5 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>
            {langOpen && (
              <ul role="menu" className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-lift">
                {LOCALES.map((l) => (
                  <li key={l} role="none">
                    <Link
                      role="menuitem"
                      href={localePath(l, rest === "/" ? "" : rest)}
                      hrefLang={l}
                      lang={l}
                      onClick={() => rememberLanguage(l)}
                      className={`flex items-center justify-between px-4 py-2 text-sm hover:bg-brand-tint ${l === lang ? "font-semibold text-brand-deep" : "text-ink"}`}
                    >
                      {LOCALE_NAMES[l]}
                      {l === lang && <span aria-hidden>✓</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-paper md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("nav.close") : t("nav.menu")}
            onClick={() => setOpenAt(open ? null : pathname)}
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label={t("nav.main")} className="border-t border-line bg-cream px-4 pb-4 pt-2 md:hidden">
          <ul className="grid gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={localePath(lang, n.href)}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-3 text-base font-medium ${isActive(n.href) ? "bg-brand-soft/70 text-brand-deep" : "text-ink"}`}
                >
                  {t(n.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link href={localePath(lang, "/my-pet")} className="mt-1 flex items-center gap-2 rounded-lg bg-brand px-3 py-3 font-semibold text-white">
                <IconPaw className="h-4 w-4" />
                {active ? t("nav.petNamed", { name: active.name }) : t("nav.addPet")}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
