"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/DictionaryProvider";
import { Field, Honeypot, SubmitStatus, inputCls, useSubmit } from "./FormKit";
import { ProductFields, emptyProduct, type ProductDraft } from "./ProductFields";

const MAX = 10;

/** Pet food companies submit their own products; the owner reviews everything before it goes live. */
export function BrandForm() {
  const t = useT();
  const { status, errors, send } = useSubmit("brand");
  const [company, setCompany] = useState({ name: "", contact: "", role: "", website: "", phone: "" });
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState<ProductDraft[]>([emptyProduct()]);
  const [message, setMessage] = useState("");
  const [authorised, setAuthorised] = useState(false);
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");

  const setC = (k: keyof typeof company, v: string) => setCompany((c) => ({ ...c, [k]: v }));
  const err = (k: string) => (errors[k] ? t(`forms.err.${errors[k]}`) : undefined);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await send({
      website: hp,
      email,
      message,
      company,
      authorised,
      consent,
      products: products.map((p) => ({ ...p, brand: company.name })),
    });
  };

  if (status === "done") return <SubmitStatus status={status} subject="" body="" />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-8">
      <Honeypot value={hp} onChange={setHp} />

      <fieldset className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8">
        <legend className="px-2 font-display text-xl font-semibold text-brand-deep">{t("brands.companyTitle")}</legend>
        <div className="mt-2 grid gap-5 sm:grid-cols-2">
          <Field id="bc-name" label={t("brands.companyName")} required error={err("companyName")}>
            <input id="bc-name" className={inputCls} value={company.name} maxLength={120} onChange={(e) => setC("name", e.target.value)} aria-invalid={!!errors.companyName} autoComplete="organization" />
          </Field>
          <Field id="bc-web" label={t("brands.website")} required error={err("website")}>
            <input id="bc-web" className={inputCls} type="url" value={company.website} maxLength={200} onChange={(e) => setC("website", e.target.value)} placeholder="https://" aria-invalid={!!errors.website} autoComplete="url" />
          </Field>
          <Field id="bc-contact" label={t("brands.contact")} required error={err("contact")}>
            <input id="bc-contact" className={inputCls} value={company.contact} maxLength={120} onChange={(e) => setC("contact", e.target.value)} aria-invalid={!!errors.contact} autoComplete="name" />
          </Field>
          <Field id="bc-role" label={t("brands.role")}>
            <input id="bc-role" className={inputCls} value={company.role} maxLength={80} onChange={(e) => setC("role", e.target.value)} />
          </Field>
          <Field id="bc-email" label={t("forms.email")} required error={err("email")}>
            <input id="bc-email" className={inputCls} type="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} autoComplete="email" />
          </Field>
          <Field id="bc-phone" label={t("brands.phone")}>
            <input id="bc-phone" className={inputCls} type="tel" value={company.phone} maxLength={40} onChange={(e) => setC("phone", e.target.value)} autoComplete="tel" />
          </Field>
        </div>
      </fieldset>

      {products.map((p, i) => (
        <fieldset key={i} className="rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8">
          <legend className="px-2 font-display text-xl font-semibold text-brand-deep">{t("brands.productN", { n: i + 1 })}</legend>
          <div className="mt-2">
            <ProductFields idPrefix={`bp${i}`} value={p} onChange={(v) => setProducts((list) => list.map((x, j) => (j === i ? v : x)))} errors={errors} showBrand={false} ingredientsRequired />
          </div>
          {products.length > 1 && (
            <button type="button" className="mt-4 text-sm font-semibold text-danger underline underline-offset-2" onClick={() => setProducts((list) => list.filter((_, j) => j !== i))}>
              {t("brands.removeProduct")}
            </button>
          )}
        </fieldset>
      ))}
      {products.length < MAX && (
        <button type="button" onClick={() => setProducts((l) => [...l, { ...emptyProduct(), species: l[l.length - 1].species, foodType: l[l.length - 1].foodType }])} className="rounded-xl border border-dashed border-brand px-5 py-3 font-semibold text-brand hover:bg-brand-tint">
          + {t("brands.addProduct")}
        </button>
      )}

      <div className="space-y-5 rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8">
        <Field id="bc-msg" label={t("brands.message")} hint={t("brands.messageHint")}>
          <textarea id="bc-msg" rows={3} className={inputCls} value={message} maxLength={3000} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
          <input type="checkbox" className="mt-0.5 h-5 w-5 rounded accent-brand" checked={authorised} onChange={(e) => setAuthorised(e.target.checked)} />
          <span>{t("brands.authorised")}{errors.authorised && <span className="ml-2 font-semibold text-danger">{t("forms.err.required")}</span>}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
          <input type="checkbox" className="mt-0.5 h-5 w-5 rounded accent-brand" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{t("forms.consent")}{errors.consent && <span className="ml-2 font-semibold text-danger">{t("forms.err.required")}</span>}</span>
        </label>
        <SubmitStatus status={status} subject={`Merk-inzending ${company.name}`} body={`${company.name}\n${company.website}\n${products.map((p) => `${p.name}\n${p.ingredients}`).join("\n\n")}`} />
        <button type="submit" disabled={status === "sending"} className="rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60">
          {status === "sending" ? t("forms.sending") : t("brands.submit")}
        </button>
      </div>
    </form>
  );
}
