import Image from "next/image";
import Link from "next/link";
import type { PostMeta } from "@/lib/blog";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/t";

export function formatDate(d: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }).format(d);
}

export function BlogCard({ post, lang, t }: { post: PostMeta; lang: Locale; t: TFunction }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={localePath(lang, `/blog/${post.slug}`)} className="flex h-full flex-col focus-visible:outline-offset-4">
        <div className="relative aspect-[16/9] bg-brand-tint">
          {post.cover ? (
            <Image src={post.cover} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl text-brand/30" aria-hidden>Scanabowl</div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="font-mono text-xs text-ink-faint">
            <time dateTime={post.date.toISOString()}>{formatDate(post.date, lang)}</time> · {t("blog.minutes", { n: post.minutes })}
            {!post.translated && <span className="ml-2 rounded bg-warn-soft px-1.5 py-0.5 text-warn">{post.lang.toUpperCase()}</span>}
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-ink group-hover:text-brand-deep">{post.title}</h3>
          {post.description && <p className="mt-2 line-clamp-3 text-[0.95rem] text-ink-soft">{post.description}</p>}
        </div>
      </Link>
    </article>
  );
}
