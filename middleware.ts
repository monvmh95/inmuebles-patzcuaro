import { NextResponse, type NextRequest } from "next/server";
import { toEsPath } from "./lib/i18n";

// /en/... se reescribe internamente a la ruta en español y marca el idioma en un header.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const headers = new Headers(req.headers);
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  headers.set("x-lang", isEn ? "en" : "es");
  headers.set("x-path", pathname + search);
  if (isEn) {
    const url = req.nextUrl.clone();
    url.pathname = toEsPath(pathname.slice(3) || "/");
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
