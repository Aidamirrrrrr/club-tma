import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { communityRequests, users } from "@/db/schema";
import { requireAdmin, requireAuth } from "@/lib/telegram";
import { isRateLimited, sanitizeRequiredText } from "@/lib/validation";

/** GET /api/community-requests — список запросов (только для админов). */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`community-requests:list:${auth.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const rows = await db
      .select({
        id: communityRequests.id,
        message: communityRequests.message,
        status: communityRequests.status,
        createdAt: communityRequests.createdAt,
        userId: communityRequests.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        photoUrl: users.photoUrl,
      })
      .from(communityRequests)
      .leftJoin(users, eq(communityRequests.userId, users.id))
      .orderBy(desc(communityRequests.createdAt));

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/community-requests error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/community-requests — отправить запрос в сообщество. */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`community-requests:create:${auth.user.id}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const message = sanitizeRequiredText(body.message, 2000);
    if (!message) {
      return NextResponse.json(
        { error: "Сообщение обязательно" },
        { status: 400 },
      );
    }

    const [row] = await db
      .insert(communityRequests)
      .values({ userId: auth.user.id, message })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST /api/community-requests error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
