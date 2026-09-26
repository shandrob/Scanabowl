import { notFound } from "next/navigation";

/**
 * Any address under a language that matches no page (e.g. /nl/typo) shows the site's own, translated
 * "page not found" instead of the plain English default. Always rendered on request and never stored,
 * so bots probing random addresses cannot fill the page cache.
 */
export const dynamic = "force-dynamic";

export default function CatchAll() {
  notFound();
}
