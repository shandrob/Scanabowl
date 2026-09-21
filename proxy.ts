import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, LOCALE_COOKIE, isLocale, negotiate } from "@/lib/i18n/config";

/**
 * Sends every request without a language prefix to /nl, /en, /de or /fr:
 * first the language the visitor picked earlier (cookie), then the browser's language, else Dutch.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie) ? cookie : negotiate(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // skip API routes, Next internals, generated data, product photos and anything with a file extension
  matcher: ["/((?!api|_next|data|products|blog-images|.*\\..*).*)"],
};
