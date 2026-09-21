"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { BarcodeScanner } from "./BarcodeScanner";
import { IconBarcode, IconSearch } from "@/components/ui/Icons";
import { localePath } from "@/lib/i18n/config";

/**
 * Search field used on the home page and in the finder.
 * Typing a barcode (8-14 digits) - or scanning one - jumps straight to that product;
 * anything else searches by name/brand.
 */
export function SearchBox({
  initial = "",
  species,
  size = "lg",
  live,
}: {
  initial?: string;
  species?: "dog" | "cat";
  size?: "lg" | "md";
  /** controlled mode used by the food finder: typing filters the list live */
  live?: { value: string; onChange: (v: string) => void };
}) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const [inner, setInner] = useState(initial);
  const value = live ? live.value : inner;
  const setValue = live ? live.onChange : setInner;
  const [scanning, setScanning] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = useCallback(
    async (ean: string) => {
      setBusy(true);
      setMissing(null);
      try {
        const res = await fetch(`/api/ean/${ean}`);
        if (res.ok) {
          const { slug } = (await res.json()) as { slug: string };
          router.push(localePath(lang, `/foods/${slug}`));
          return;
        }
        setMissing(ean);
      } catch {
        setMissing(ean);
      } finally {
        setBusy(false);
      }
    },
    [lang, router],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    if (/^\d{8,14}$/.test(q.replace(/[\s-]/g, ""))) {
      void lookup(q.replace(/[\s-]/g, ""));
      return;
    }
    if (live) return; // the list is already filtered while typing
    const params = new URLSearchParams({ q });
    if (species) params.set("species", species);
    router.push(`${localePath(lang, "/foods")}?${params.toString()}`);
  };

  const onDetect = useCallback(
    (code: string) => {
      setScanning(false);
      setValue(code);
      void lookup(code);
    },
    [lookup, setValue],
  );

  const big = size === "lg";
  return (
    <div>
      <form onSubmit={submit} role="search" className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-stretch">
        <div className="relative col-span-2 sm:min-w-[13rem] sm:flex-[1_1_16rem]">
          <IconSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint ${big ? "h-5 w-5" : "h-4 w-4"}`} />
          <input
            type="search"
            inputMode="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.label")}
            className={`w-full rounded-2xl border border-line bg-paper pl-12 pr-4 text-ink shadow-card placeholder:text-ink-faint focus:border-brand-mid focus:outline-none focus:ring-4 focus:ring-brand-soft ${big ? "h-14 text-lg" : "h-11 text-base"}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setScanning(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-brand bg-paper px-4 font-semibold text-brand transition hover:bg-brand-tint ${big ? "h-14" : "h-11"}`}
          aria-label={t("search.scan")}
        >
          <IconBarcode className="h-5 w-5" />
          <span>{t("search.scan")}</span>
        </button>
        <button
          type="submit"
          disabled={busy}
          className={`rounded-2xl bg-brand px-5 font-semibold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60 ${big ? "h-14" : "h-11"}`}
        >
          {busy ? t("common.loading") : t("search.button")}
        </button>
      </form>
      {missing && (
        <p className="mt-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-ink" role="status">
          {t("search.notFound", { ean: missing })}{" "}
          <Link href={`${localePath(lang, "/suggest")}?ean=${missing}`} className="font-semibold text-brand underline underline-offset-2">
            {t("search.suggestIt")}
          </Link>
        </p>
      )}
      {scanning && <BarcodeScanner onDetect={onDetect} onClose={() => setScanning(false)} />}
    </div>
  );
}
