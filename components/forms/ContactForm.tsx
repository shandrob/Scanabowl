"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/DictionaryProvider";
import { Field, Honeypot, SubmitStatus, inputCls, useSubmit } from "./FormKit";

export function ContactForm() {
  const t = useT();
  const { status, errors, send } = useSubmit("contact");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const err = (k: string) => (errors[k] ? t(`forms.err.${errors[k]}`) : undefined);

  if (status === "done") return <SubmitStatus status={status} subject="" body="" />;
  return (
    <form
      noValidate
      className="relative space-y-5 rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        await send({ website: hp, email, message, consent, products: [] });
      }}
    >
      <Honeypot value={hp} onChange={setHp} />
      <Field id="ct-email" label={t("forms.email")} required error={err("email")}>
        <input id="ct-email" type="email" className={inputCls} value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
      </Field>
      <Field id="ct-msg" label={t("contact.message")} required error={err("message")}>
        <textarea id="ct-msg" rows={6} className={inputCls} value={message} maxLength={3000} onChange={(e) => setMessage(e.target.value)} aria-invalid={!!errors.message} />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" className="mt-0.5 h-5 w-5 rounded accent-brand" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{t("forms.consent")}{errors.consent && <span className="ml-2 font-semibold text-danger">{t("forms.err.required")}</span>}</span>
      </label>
      <SubmitStatus status={status} subject="Contact" body={message} />
      <button type="submit" disabled={status === "sending"} className="rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60">
        {status === "sending" ? t("forms.sending") : t("contact.send")}
      </button>
    </form>
  );
}
