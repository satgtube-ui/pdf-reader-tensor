import { NextResponse } from "next/server";
import { AUTH_COOKIE, LOGIN_PASSWORD, LOGIN_USERNAME, SESSION_TOKEN } from "@/lib/auth-config";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (username !== LOGIN_USERNAME || password !== LOGIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
