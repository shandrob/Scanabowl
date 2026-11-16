import Link from "next/link";
import { IconHeart, IconPaw } from "@/components/ui/Icons";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { SITE } from "@/lib/site";

/**
 * Voluntary supporter banner ("100% Free for Every Pet Owner").
 * Uses NEXT_PUBLIC_SUPPORT_URL (e.g. Stripe Payment Link / Ko-fi) when configured,
 * or routes visitors to /about#support / contact with a prefilled message.
 */
export function SupportBanner({ lang, t }: { lang: Locale; t: TFunction }) {
  const hasExternal = Boolean(SITE.supportUrl);
  const href = hasExternal ? SITE.supportUrl : `${localePath(lang, "/about")}#support`;

  return (
    <section
      id="support"
      aria-labelledby="support-h"
      className="mt-10 rounded-2xl border border-brand/25 bg-brand-soft/60 p-6 shadow-card sm:p-8"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 font-sans text-xs font-semibold text-brand-deep border border-brand/20">
            <IconPaw className="h-3.5 w-3.5 text-brand" />
            {t("support.badge")}
          </p>
          <h2 id="support-h" className="mt-3 font-display text-2xl font-semibold tracking-tight text-brand-deep">
            {t("support.title")}
          </h2>
          <p className="mt-2 font-sans text-sm leading-relaxed text-ink-soft">
            {t("support.text")}
          </p>
        </div>

        <div className="shrink-0">
          {hasExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-sans text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deep"
            >
              <IconHeart className="h-4 w-4" />
              {t("support.cta")}
            </a>
          ) : (
            <Link
              href={localePath(lang, "/contact")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-sans text-sm font-semibold text-white shadow-sm transition hover:bg-brand-deep"
            >
              <IconHeart className="h-4 w-4" />
              {t("support.cta")}
            </Link>
          )}
          <p className="mt-2 text-center font-sans text-[11px] text-ink-faint">{t("support.note")}</p>
        </div>
      </div>
    </section>
  );
}
