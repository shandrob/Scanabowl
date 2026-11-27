"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/DictionaryProvider";
import { IconCheck } from "@/components/ui/Icons";
import { trackShareFood } from "@/lib/analytics";

/** One-tap WhatsApp share and copy-link actions for a product score page. */
export function ShareFoodButton({ name, score, url }: { name: string; score: number | null; url: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const shareText =
    score !== null
      ? t("product.shareMessage", { name, score, url })
      : t("product.shareMessageNoScore", { name, url });

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      trackShareFood("copy_link", name, score);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. non-secure context)
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackShareFood("whatsapp", name, score)}
        className="inline-flex items-center gap-2 rounded-full border border-[#E2DDD5] bg-paper px-4 py-2 font-sans text-sm font-medium text-ink transition hover:border-brand hover:bg-brand-soft hover:text-brand-deep md:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {t("product.shareWhatsapp")}
      </a>
      <button
        type="button"
        onClick={copy}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-sans text-sm font-medium transition ${
          copied
            ? "border-brand bg-brand-soft text-brand-deep"
            : "border-[#E2DDD5] bg-paper text-ink-soft hover:border-brand hover:text-brand"
        }`}
      >
        {copied && <IconCheck className="h-4 w-4" />}
        {copied ? t("product.copied") : t("product.copyLink")}
      </button>
    </div>
  );
}
