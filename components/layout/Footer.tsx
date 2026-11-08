import Image from "next/image";
import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { SITE } from "@/lib/site";

export function Footer({ lang, t }: { lang: Locale; t: TFunction }) {
  const col = (title: string, links: Array<[string, string]>) => (
    <div>
      <h2 className="border-b border-line pb-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-ink">{title}</h2>
      <ul className="mt-3 space-y-2 text-[0.92rem]">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={localePath(lang, href)} className="text-ink-soft transition-colors hover:text-ink hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="mt-20 border-t-2 border-ink bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href={localePath(lang)} className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={32} height={32} className="rounded-sm border border-ink" />
              <span className="font-display text-lg font-semibold tracking-tight text-ink">Scanabowl</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">{t("footer.blurb")}</p>
            <p className="mt-3 inline-block rounded-sm border border-line bg-stone px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft">
              FEDIAF 2021 · Dry Matter Basis
            </p>
          </div>
          {col(t("footer.explore"), [
            ["/foods", t("nav.foods")],
            ["/best", t("nav.best")],
            ["/compare", t("nav.compare")],
            ["/foods/brand", t("nav.allBrands")],
            ["/my-pet", t("nav.myPet")],
            ["/blog", t("nav.blog")],
            ["/how-we-score", t("nav.howWeScore")],
          ])}
          {col(t("footer.contribute"), [
            ["/suggest", t("nav.suggest")],
            ["/brands", t("nav.brands")],
            ["/about", t("nav.about")],
            ["/contact", t("nav.contact")],
          ])}
          {col(t("footer.legal"), [
            ["/privacy", t("nav.privacy")],
            ["/terms", t("nav.terms")],
            ["/affiliate", t("nav.affiliate")],
          ])}
        </div>
        <div className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-ink-faint">
          <p>{t("footer.disclaimer")}</p>
          <p className="mt-2">
            {t("footer.photos").split("{source}")[0]}
            <a href="https://world.openpetfoodfacts.org" rel="noopener" className="underline underline-offset-2 hover:text-ink">Open Pet Food Facts</a>
            {t("footer.photos").split("{source}")[1]}
          </p>
          <p className="mt-2 font-mono text-[0.72rem] tabular-nums">
            © {new Date().getFullYear()} Scanabowl ·{" "}
            <a href={`mailto:${SITE.email}`} className="underline underline-offset-2 hover:text-ink">{SITE.email}</a>
            {SITE.company.kvk ? ` · KvK ${SITE.company.kvk}` : ""}
            {SITE.company.vat ? ` · ${t("footer.vat")} ${SITE.company.vat}` : ""}
          </p>
        </div>
      </div>
    </footer>
  );
}
