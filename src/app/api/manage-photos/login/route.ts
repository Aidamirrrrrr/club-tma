import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import {
  checkPassword,
  expectedToken,
  PHOTOS_COOKIE,
} from "@/server/auth/photos";

/** POST /api/manage-photos/login — вход по паролю, ставит куку-сессию. */
export async function POST(request: Request) {
  try {
    if (isRateLimited("photos-login", 10, 60_000)) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const token = expectedToken();
    if (!token) {
      return NextResponse.json(
        { error: "Password is not configured" },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    if (!checkPassword(body?.password)) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(PHOTOS_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Photos login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
