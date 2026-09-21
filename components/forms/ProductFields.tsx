"use client";

import { useT } from "@/components/i18n/DictionaryProvider";
import { Field, inputCls } from "./FormKit";

export interface ProductDraft {
  name: string;
  brand: string;
  species: "dog" | "cat";
  foodType: "dry" | "wet" | "frozen" | "other";
  lifeStage: "young" | "adult" | "senior" | "all";
  ean: string;
  ingredients: string;
  analysis: string;
  pack: string;
  url: string;
}

export const emptyProduct = (brand = ""): ProductDraft => ({
  name: "",
  brand,
  species: "dog",
  foodType: "dry",
  lifeStage: "adult",
  ean: "",
  ingredients: "",
  analysis: "",
  pack: "",
  url: "",
});

/** One product's worth of fields; used by the visitor form and (repeated) by the brand form. */
export function ProductFields({
  idPrefix,
  value,
  onChange,
  errors,
  showBrand = true,
  showUrl = true,
  ingredientsRequired = false,
}: {
  idPrefix: string;
  value: ProductDraft;
  onChange: (v: ProductDraft) => void;
  errors: Record<string, string>;
  showBrand?: boolean;
  showUrl?: boolean;
  ingredientsRequired?: boolean;
}) {
  const t = useT();
  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => onChange({ ...value, [k]: v });
  const err = (k: string) => (errors[k] ? t(`forms.err.${errors[k]}`) : undefined);
  const id = (k: string) => `${idPrefix}-${k}`;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field id={id("name")} label={t("forms.productName")} required error={err("name")}>
        <input id={id("name")} className={inputCls} value={value.name} maxLength={160} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} placeholder={t("forms.productNamePh")} />
      </Field>
      {showBrand ? (
        <Field id={id("brand")} label={t("forms.brand")} required error={err("brand")}>
          <input id={id("brand")} className={inputCls} value={value.brand} maxLength={80} onChange={(e) => set("brand", e.target.value)} aria-invalid={!!errors.brand} />
        </Field>
      ) : (
        <div />
      )}
      <Field id={id("species")} label={t("forms.species")} required>
        <select id={id("species")} className={inputCls} value={value.species} onChange={(e) => set("species", e.target.value as ProductDraft["species"])}>
          <option value="dog">{t("common.dog")}</option>
          <option value="cat">{t("common.cat")}</option>
        </select>
      </Field>
      <Field id={id("type")} label={t("finder.type")}>
        <select id={id("type")} className={inputCls} value={value.foodType} onChange={(e) => set("foodType", e.target.value as ProductDraft["foodType"])}>
          <option value="dry">{t("type.dry")}</option>
          <option value="wet">{t("type.wet")}</option>
          <option value="frozen">{t("type.frozen")}</option>
          <option value="other">{t("type.other")}</option>
        </select>
      </Field>
      <Field id={id("stage")} label={t("finder.stage")}>
        <select id={id("stage")} className={inputCls} value={value.lifeStage} onChange={(e) => set("lifeStage", e.target.value as ProductDraft["lifeStage"])}>
          <option value="young">{value.species === "dog" ? t("stage.youngDog") : t("stage.youngCat")}</option>
          <option value="adult">{t("stage.adult")}</option>
          <option value="senior">{t("stage.senior")}</option>
          <option value="all">{t("stage.all")}</option>
        </select>
      </Field>
      <Field id={id("ean")} label={t("forms.ean")} hint={t("forms.eanHint")}>
        <input id={id("ean")} className={inputCls} inputMode="numeric" value={value.ean} maxLength={20} onChange={(e) => set("ean", e.target.value.replace(/[^\d]/g, ""))} />
      </Field>
      <div className="sm:col-span-2">
        <Field id={id("ingredients")} label={t("forms.ingredients")} hint={t("forms.ingredientsHint")} required={ingredientsRequired} error={err("ingredients")}>
          <textarea id={id("ingredients")} rows={4} className={inputCls} value={value.ingredients} maxLength={4000} onChange={(e) => set("ingredients", e.target.value)} aria-invalid={!!errors.ingredients} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id={id("analysis")} label={t("forms.analysis")} hint={t("forms.analysisHint")}>
          <textarea id={id("analysis")} rows={2} className={inputCls} value={value.analysis} maxLength={1500} onChange={(e) => set("analysis", e.target.value)} />
        </Field>
      </div>
      <Field id={id("pack")} label={t("forms.pack")}>
        <input id={id("pack")} className={inputCls} value={value.pack} maxLength={60} onChange={(e) => set("pack", e.target.value)} placeholder="12x85 g / 2 kg" />
      </Field>
      {showUrl && (
        <Field id={id("url")} label={t("forms.url")} hint={t("forms.urlHint")}>
          <input id={id("url")} className={inputCls} type="url" value={value.url} maxLength={300} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
        </Field>
      )}
    </div>
  );
}
