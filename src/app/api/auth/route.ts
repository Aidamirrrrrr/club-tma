import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { parseInitDataUser, validateInitData } from "@/lib/telegram";
import {
  isRateLimited,
  sanitizeHandle,
  sanitizeText,
  sanitizeUrl,
} from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Basic request size guard
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
      // Fallback for dev/demo mode (no initData)
      // Allow when BOT_TOKEN is not configured (local testing)
      if (process.env.NODE_ENV !== "development" && process.env.BOT_TOKEN) {
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

    // Rate limit: 30 auth requests per minute per user
    if (isRateLimited(`auth:${id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Sanitize inputs
    const cleanFirstName = sanitizeText(first_name, 100) || "User";
    const cleanLastName = sanitizeText(last_name, 100) || "";
    const cleanUsername = sanitizeHandle(username, 64);
    const cleanPhotoUrl = sanitizeUrl(photo_url);

    const telegramId = String(id);

    // Check if user exists
    const existing = await db.query.users.findFirst({
      where: eq(users.telegramId, telegramId),
    });

    if (existing) {
      // Check if blocked
      if (existing.blocked) {
        return NextResponse.json({ error: "User is blocked" }, { status: 403 });
      }

      // Update basic info from Telegram
      const [updated] = await db
        .update(users)
        .set({
          firstName: cleanFirstName,
          lastName: cleanLastName,
          username: cleanUsername,
          photoUrl: cleanPhotoUrl || existing.photoUrl,
        })
        .where(eq(users.telegramId, telegramId))
        .returning();

      return NextResponse.json({ user: updated });
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        telegramId,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        username: cleanUsername,
        photoUrl: cleanPhotoUrl,
        telegram: cleanUsername ? `@${cleanUsername}` : "",
      })
      .returning();

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
