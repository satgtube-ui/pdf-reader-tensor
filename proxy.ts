import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_TOKEN } from "@/lib/auth-config";

export function proxy(request: NextRequest) {
  if (request.cookies.get(AUTH_COOKIE)?.value !== SESSION_TOKEN) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/notes/:path*"] };
