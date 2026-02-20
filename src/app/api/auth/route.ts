import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateInitData, parseInitDataUser } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData } = body;

    let id: number;
    let first_name: string;
    let last_name: string | undefined;
    let username: string | undefined;
    let photo_url: string | undefined;

    if (initData) {
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
          firstName: first_name,
          lastName: last_name || "",
          username: username || "",
          photoUrl: photo_url || existing.photoUrl,
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
        firstName: first_name,
        lastName: last_name || "",
        username: username || "",
        photoUrl: photo_url || "",
        telegram: username ? `@${username}` : "",
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
