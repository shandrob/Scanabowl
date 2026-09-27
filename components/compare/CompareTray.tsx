"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { IconX } from "@/components/ui/Icons";
import { MAX_COMPARE, useCompare } from "@/lib/compare/store";
import { localePath, stripLocale } from "@/lib/i18n/config";
import { speciesLabel } from "@/lib/labels";

/**
 * Floating "Compare (2/3)" bar, on every page while the visitor has foods in a comparison list.
 * Rendered only in the browser (the list lives in this browser), so it never changes a cached page.
 */
export function CompareTray() {
  const t = useT();
  const lang = useLang();
  const pathname = usePathname();
  const { lists, set } = useCompare();
  if (stripLocale(pathname) === "/compare") return null;
  const active = (["dog", "cat"] as const).filter((sp) => lists[sp].length > 0);
  if (!active.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-brand/30 bg-paper/95 p-2 shadow-lift backdrop-blur">
        {active.map((sp) => (
          <span key={sp} className="flex items-center gap-1">
            <Link
              href={`${localePath(lang, "/compare")}?species=${sp}&f=${lists[sp].map(encodeURIComponent).join(",")}`}
              prefetch={false}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-deep"
            >
              {t("compare.tray", { species: speciesLabel(t, sp, true), count: lists[sp].length, max: MAX_COMPARE })}
            </Link>
            <button type="button" onClick={() => set(sp, [])} aria-label={t("compare.trayClear")} className="rounded-lg p-2 text-ink-faint hover:bg-cream hover:text-ink">
              <IconX className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
