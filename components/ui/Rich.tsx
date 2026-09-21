import Link from "next/link";
import { Fragment } from "react";

/**
 * Tiny inline formatter for dictionary strings: **bold** and [label](/path or https://url).
 * Keeps translators away from HTML while still allowing links inside sentences.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          return /^https?:/.test(href) ? (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ) : href.startsWith("mailto:") ? (
            <a key={i} href={href}>
              {label}
            </a>
          ) : (
            <Link key={i} href={href}>
              {label}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
