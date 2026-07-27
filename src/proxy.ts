import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/*
  Route guard. Every page requires a valid session except sign-in and the
  cron endpoint (which carries its own secret). Full user lookup happens
  server-side; this only verifies the signed cookie.
*/
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/forgot") ||
    pathname.startsWith("/reset/") ||
    pathname.startsWith("/request") ||
    pathname.startsWith("/api/reminders") ||
    pathname.startsWith("/api/weekly") ||
    pathname.startsWith("/api/feed/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/apple-icon.png" ||
    pathname === "/manifest.webmanifest"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("lh_session")?.value;
  if (token && process.env.AUTH_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      return NextResponse.next();
    } catch {
      // fall through to redirect
    }
  }

  const signin = new URL("/signin", request.url);
  return NextResponse.redirect(signin);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
