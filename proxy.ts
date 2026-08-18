import { NextResponse, type NextRequest } from "next/server";

// Comprobación optimista: si no hay cookie de sesión, a /login.
// La validación de verdad (alumno activo) la hacen las páginas de servidor.
const isPublic = (pathname: string) =>
  pathname === "/login" ||
  pathname.startsWith("/api/auth") ||
  pathname.startsWith("/assets") ||
  pathname === "/favicon.ico";

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
