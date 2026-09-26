import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LongPage } from "@/components/ui/LongPage";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createRaw, createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/privacy", t("privacy.metaTitle"), t("privacy.metaDescription"));
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = createT(dict);
  return (
    <LongPage title={t("privacy.title")} intro={t("privacy.intro")} updated={t("legal.updated", { date: "2026-09-26" })} sections={createRaw(dict)("privacy.sections")}>
      <section>
        <h2>{t("legal.companyTitle")}</h2>
        <p>
          Scanabowl<br />
          {SITE.company.address && <>{SITE.company.address}<br /></>}
          {t("legal.email")}: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          {SITE.company.kvk && <><br />KvK: {SITE.company.kvk}</>}
          {SITE.company.vat && <><br />{t("footer.vat")}: {SITE.company.vat}</>}
        </p>
      </section>
    </LongPage>
  );
}
