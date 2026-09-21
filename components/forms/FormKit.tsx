"use client";

import { useState } from "react";
import { useLang, useT } from "@/components/i18n/DictionaryProvider";
import { IconAlert, IconCheck } from "@/components/ui/Icons";
import { SITE } from "@/lib/site";

export const inputCls =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-brand-mid focus:outline-none focus:ring-4 focus:ring-brand-soft aria-[invalid=true]:border-danger";
export const labelCls = "mb-1.5 block text-sm font-semibold text-ink";

export function Field({ id, label, hint, error, required, children }: { id: string; label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span className="text-danger" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}

type Status = "idle" | "sending" | "done" | "error" | "not_configured";

/** Shared submit logic: posts JSON to /api/submit, tracks status and per-field errors. */
export function useSubmit(kind: "product" | "brand" | "report" | "contact") {
  const lang = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadedAt] = useState(() => Date.now());

  async function send(payload: Record<string, unknown>) {
    setStatus("sending");
    setErrors({});
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, kind, lang, ts: loadedAt }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Array<{ field: string; code: string }> };
      if (data.ok) {
        setStatus("done");
        return true;
      }
      if (data.error === "invalid" && data.fields) {
        setErrors(Object.fromEntries(data.fields.map((f) => [f.field, f.code])));
        setStatus("idle");
        return false;
      }
      setStatus(data.error === "not_configured" ? "not_configured" : "error");
    } catch {
      setStatus("error");
    }
    return false;
  }
  return { status, errors, send, setErrors };
}

export function SubmitStatus({ status, subject, body }: { status: Status; subject: string; body: string }) {
  const t = useT();
  if (status === "done")
    return (
      <div className="flex gap-3 rounded-2xl border border-grade-a/30 bg-grade-a-soft p-5 text-ink" role="status">
        <IconCheck className="mt-0.5 h-6 w-6 shrink-0 text-grade-a" />
        <div>
          <p className="font-display text-lg font-semibold text-grade-a">{t("forms.thanksTitle")}</p>
          <p className="mt-1">{t("forms.thanksText")}</p>
        </div>
      </div>
    );
  if (status === "error" || status === "not_configured")
    return (
      <div className="flex gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-5" role="alert">
        <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
        <div className="text-sm text-ink">
          <p className="font-semibold text-danger">{t("forms.errorTitle")}</p>
          <p className="mt-1">
            {t("forms.errorText")}{" "}
            <a className="font-semibold text-brand underline underline-offset-2" href={`mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1500))}`}>
              {t("forms.errorMail", { email: SITE.email })}
            </a>
          </p>
        </div>
      </div>
    );
  return null;
}

/** Hidden honeypot field: humans never see it, bots fill it in. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} name="website" />
      </label>
    </div>
  );
}
