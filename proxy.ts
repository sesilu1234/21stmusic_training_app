import { NextResponse, type NextRequest } from "next/server";

// Comprobación optimista: si no hay cookie de sesión, a /login.
// La validación de verdad (alumno activo) la hacen las páginas de servidor.
// Las páginas de información son públicas: la de privacidad tiene que poder
// leerse sin cuenta, y las otras dos no enseñan nada de nadie.
const PUBLIC_PAGES = new Set(["/login", "/contacto", "/sobre", "/privacidad", "/favicon.ico"]);

const isPublic = (pathname: string) =>
  PUBLIC_PAGES.has(pathname) ||
  pathname.startsWith("/api/auth") ||
  pathname.startsWith("/assets");

const hasSessionCookie = (request: NextRequest) =>
  request.cookies.has("authjs.session-token") ||
  request.cookies.has("__Secure-authjs.session-token");

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname) || hasSessionCookie(request)) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|assets|favicon.ico).*)"],
};
