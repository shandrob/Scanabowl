import { Rich } from "./Rich";
import type { Messages } from "@/lib/i18n/t";

export interface Section {
  h?: string;
  p?: string[];
  ul?: string[];
  ol?: string[];
}

/** Renders a list of sections (heading + paragraphs + lists) from a dictionary block. */
export function Sections({ sections }: { sections: Array<string | Messages> }) {
  return (
    <>
      {(sections as unknown as Section[]).map((s, i) => (
        <section key={i}>
          {s.h && <h2>{s.h}</h2>}
          {s.p?.map((p, j) => (
            <p key={j}><Rich text={p} /></p>
          ))}
          {s.ul && (
            <ul>
              {s.ul.map((li, j) => (
                <li key={j}><Rich text={li} /></li>
              ))}
            </ul>
          )}
          {s.ol && (
            <ol>
              {s.ol.map((li, j) => (
                <li key={j}><Rich text={li} /></li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </>
  );
}

/** Renders a long-form page (privacy, terms, ...) from a dictionary block. */
export function LongPage({ title, intro, sections, updated, children }: { title: string; intro?: string; sections: Array<string | Messages>; updated?: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold leading-tight text-brand-deep sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 text-lg leading-relaxed text-ink-soft"><Rich text={intro} /></p>}
        {updated && <p className="mt-3 font-mono text-xs text-ink-faint">{updated}</p>}
      </header>
      <div className="prose-scan mt-8">
        <Sections sections={sections} />
        {children}
      </div>
    </div>
  );
}
