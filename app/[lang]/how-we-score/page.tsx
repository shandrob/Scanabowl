import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GRADE_STYLE } from "@/components/ui/grade";
import { Rich } from "@/components/ui/Rich";
import { Sections } from "@/components/ui/LongPage";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createRaw, createT } from "@/lib/i18n/t";
import { pageMeta } from "@/lib/meta";
import { GRADE_LIMITS } from "@/lib/scoring/score";
import type { Grade } from "@/lib/scoring/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(await getDictionary(lang));
  return pageMeta(lang, "/how-we-score", t("method.metaTitle"), t("method.metaDescription"));
}

const PILLARS = [
  { key: "nutrition", pts: 35, color: "#0b7a57" },
  { key: "ingredients", pts: 50, color: "#065f46" },
  { key: "formulation", pts: 15, color: "#4d7c0f" },
] as const;

export default async function MethodPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = createT(dict);
  const raw = createRaw(dict);
  const refs = raw<string[]>("method.refs");
  const ranges: Array<[Grade, string]> = [];
  const limits = [...GRADE_LIMITS];
  limits.forEach(([g, min], i) => ranges.push([g, `${min}${i === 0 ? "–100" : `–${limits[i - 1][1] - 1}`}`]));
  ranges.push(["E", `0–${limits[limits.length - 1][1] - 1}`]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold leading-tight text-brand-deep sm:text-5xl">{t("method.title")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft"><Rich text={t("method.intro")} /></p>
      </header>

      <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label={t("method.glance")}>
        {PILLARS.map((p) => (
          <div key={p.key} className="rounded-2xl border border-line bg-paper p-6 shadow-card">
            <p className="font-mono text-4xl font-semibold" style={{ color: p.color }}>{p.pts}<span className="text-lg text-ink-faint"> / 100</span></p>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink">{t(`score.pillars.${p.key}`)}</h2>
            <p className="mt-2 text-[0.95rem] text-ink-soft">{t(`method.pillar.${p.key}`)}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-line/70"><div className="h-full rounded-full" style={{ width: `${p.pts}%`, background: p.color }} /></div>
          </div>
        ))}
      </section>

      <section className="mt-10 max-w-3xl rounded-2xl border border-line bg-paper p-6 shadow-card" aria-labelledby="grades-h">
        <h2 id="grades-h" className="font-display text-2xl font-semibold text-brand-deep">{t("method.gradesTitle")}</h2>
        <ul className="mt-4 divide-y divide-line">
          {ranges.map(([g, range]) => (
            <li key={g} className="flex items-center gap-4 py-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl font-mono text-lg font-semibold text-white ${GRADE_STYLE[g].solid}`}>{g}</span>
              <span className="w-20 font-mono text-sm text-ink-soft">{range}</span>
              <span className="flex-1"><strong>{t(`grade.${g}`)}</strong> <span className="text-ink-soft">– {t(`grade.desc.${g}`)}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <div className="prose-scan mt-10">
        <Sections sections={raw("method.sections")} />
        <section>
          <h2>{t("method.refsTitle")}</h2>
          <ol className="text-[0.95rem]">
            {refs.map((r, i) => (
              <li key={i}><Rich text={r} /></li>
            ))}
          </ol>
        </section>
        <section>
          <h2>{t("method.versionTitle")}</h2>
          <p>{t("method.version")}</p>
          <p>
            <Link href={localePath(lang, "/suggest")}>{t("method.feedback")}</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
