import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login"];
const publicPrefixes = [
  "/api/auth",
  "/_next/static",
  "/_next/image",
  "/assets",
];

const hasSessionCookie = (request: NextRequest) =>
  request.cookies.has("authjs.session-token") ||
  request.cookies.has("__Secure-authjs.session-token");

export function middleware(request: NextRequest) {
  // const { pathname } = request.nextUrl;
  // const isPublic =
  //   publicPaths.includes(pathname) ||
  //   publicPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
  //   pathname === "/favicon.ico";
  // if (isPublic) return NextResponse.next();
  // if (hasSessionCookie(request)) return NextResponse.next();
  // const loginUrl = request.nextUrl.clone();
  // loginUrl.pathname = "/login";
  // return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|assets|favicon.ico).*)"],
};
