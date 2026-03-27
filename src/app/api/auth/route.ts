import { NextResponse } from "next/server";
import { db } from "@/db";
import { isRateLimited } from "@/lib/rate-limit";
import { sanitizeHandle, sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import { parseInitDataUser, validateInitData } from "@/server/auth/telegram";

function isDevAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.BOT_TOKEN;
}

/** POST /api/auth — авторизация/регистрация через Telegram initData. */
export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > 50_000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const body = await request.json();
    const { initData } = body;

    let id: number;
    let first_name: string;
    let last_name: string | undefined;
    let username: string | undefined;
    let photo_url: string | undefined;

    if (initData) {
      if (typeof initData !== "string" || initData.length > 4096) {
        return NextResponse.json(
          { error: "Invalid init data" },
          { status: 400 },
        );
      }

      if (!validateInitData(initData)) {
        return NextResponse.json(
          { error: "Invalid init data" },
          { status: 401 },
        );
      }
      const parsed = parseInitDataUser(initData);
      if (!parsed) {
        return NextResponse.json(
          { error: "Invalid user data" },
          { status: 400 },
        );
      }
      ({ id, first_name, last_name, username, photo_url } = parsed);
    } else {
      if (!isDevAuthBypassEnabled()) {
        return NextResponse.json(
          { error: "initData required" },
          { status: 401 },
        );
      }
      ({ id, first_name, last_name, username, photo_url } = body);
      if (!id || !first_name) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
      }
    }

    if (isRateLimited(`auth:${id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const cleanFirstName = sanitizeText(first_name, 100) || "User";
    const cleanLastName = sanitizeText(last_name, 100) || "";
    const cleanUsername = sanitizeHandle(username, 64);
    const cleanPhotoUrl = sanitizeUrl(photo_url);

    const telegramId = String(id);

    const existing = await db.user.findFirst({
      where: { telegramId },
    });

    if (existing) {
      if (existing.blocked) {
        return NextResponse.json({ error: "User is blocked" }, { status: 403 });
      }

      const updated = await db.user.update({
        where: { id: existing.id },
        data: {
          firstName: cleanFirstName,
          lastName: cleanLastName,
          username: cleanUsername,
          photoUrl: cleanPhotoUrl || existing.photoUrl,
        },
      });

      return NextResponse.json({ user: updated });
    }

    const newUser = await db.user.create({
      data: {
        telegramId,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        username: cleanUsername,
        photoUrl: cleanPhotoUrl,
        telegram: cleanUsername ? `@${cleanUsername}` : "",
      },
    });

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
