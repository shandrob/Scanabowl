"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/i18n/DictionaryProvider";
import { Field, Honeypot, SubmitStatus, inputCls, useSubmit } from "./FormKit";
import { PhotoField, type PhotoDraft } from "./PhotoField";
import { ProductFields, emptyProduct, type ProductDraft } from "./ProductFields";

/** Visitors suggest a missing product - or report a mistake in an existing one (?report=EAN). */
export function SuggestForm() {
  const t = useT();
  const params = useSearchParams();
  const reportRef = params.get("report");
  const isReport = !!reportRef;
  const { status, errors, send } = useSubmit(isReport ? "report" : "product");
  const [product, setProduct] = useState<ProductDraft>(() => ({ ...emptyProduct(), ean: (params.get("ean") ?? "").replace(/\D/g, "") }));
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [photoPermission, setPhotoPermission] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await send({
      website: hp,
      email,
      message,
      consent,
      products: isReport ? [] : [product],
      reportRef: reportRef ?? undefined,
      reportName: params.get("name") ?? undefined,
      photos: photos.map(({ name, type, data }) => ({ name, type, data })),
      photoPermission,
    });
  };

  if (status === "done") return <SubmitStatus status={status} subject="" body="" />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-6 rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8">
      <Honeypot value={hp} onChange={setHp} />
      {isReport ? (
        <>
          <p className="rounded-xl bg-brand-tint p-4 text-sm text-ink">
            {t("forms.reportAbout")} <strong>{params.get("name") ?? reportRef}</strong>
          </p>
          <Field id="rp-msg" label={t("forms.reportMessage")} required error={errors.message ? t(`forms.err.${errors.message}`) : undefined} hint={t("forms.reportHint")}>
            <textarea id="rp-msg" rows={6} className={inputCls} value={message} maxLength={3000} onChange={(e) => setMessage(e.target.value)} aria-invalid={!!errors.message} />
          </Field>
        </>
      ) : (
        <ProductFields idPrefix="sg" value={product} onChange={setProduct} errors={errors} />
      )}
      <PhotoField
        idPrefix="sg"
        photos={photos}
        onChange={setPhotos}
        permission={photoPermission}
        onPermission={setPhotoPermission}
        error={errors.photos ? t(`forms.err.${errors.photos}`) : undefined}
      />
      <Field id="sg-email" label={t(isReport ? "forms.emailOptional" : "forms.emailNotify")} error={errors.email ? t(`forms.err.${errors.email}`) : undefined} hint={t("forms.emailPrivacy")}>
        <input id="sg-email" type="email" className={inputCls} value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
      </Field>
      {email && (
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
          <input type="checkbox" className="mt-0.5 h-5 w-5 rounded accent-brand" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{t("forms.consent")}{errors.consent && <span className="ml-2 font-semibold text-danger">{t("forms.err.required")}</span>}</span>
        </label>
      )}
      <SubmitStatus status={status} subject={isReport ? `Foutmelding ${reportRef}` : `Productsuggestie ${product.name}`} body={isReport ? message : `${product.brand} ${product.name}\nEAN ${product.ean}\n\n${product.ingredients}\n\n${product.analysis}`} />
      <button type="submit" disabled={status === "sending"} className="rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-60">
        {status === "sending" ? t("forms.sending") : t(isReport ? "forms.sendReport" : "forms.sendSuggestion")}
      </button>
      <p className="text-xs text-ink-faint">{t("forms.reviewNote")}</p>
    </form>
  );
}
