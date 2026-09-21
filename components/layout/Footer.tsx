import Image from "next/image";
import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";
import { SITE } from "@/lib/site";

export function Footer({ lang, t }: { lang: Locale; t: TFunction }) {
  const col = (title: string, links: Array<[string, string]>) => (
    <div>
      <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-brand">{title}</h2>
      <ul className="mt-3 space-y-2 text-[0.95rem]">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={localePath(lang, href)} className="text-ink-soft transition-colors hover:text-brand-deep hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href={localePath(lang)} className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg" />
              <span className="font-display text-lg font-semibold text-brand-deep">Scanabowl</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">{t("footer.blurb")}</p>
          </div>
          {col(t("footer.explore"), [
            ["/foods", t("nav.foods")],
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
            © {new Date().getFullYear()} Scanabowl · {SITE.email}
            {SITE.company.kvk ? ` · KvK ${SITE.company.kvk}` : ""}
            {SITE.company.vat ? ` · ${t("footer.vat")} ${SITE.company.vat}` : ""}
          </p>
        </div>
      </div>
    </footer>
  );
}
