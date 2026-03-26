import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { requireAdmin, requireAuth } from "@/lib/telegram";
import {
  isRateLimited,
  sanitizeRequiredText,
  sanitizeText,
} from "@/lib/validation";

/** GET /api/chats — список чатов и каналов. */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`chats:list:${auth.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const rows = await db
      .select()
      .from(chats)
      .orderBy(asc(chats.sort), asc(chats.id));

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/chats error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/chats — добавить чат/канал (админ). */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`chats:create:${auth.user.id}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();

    const title = sanitizeRequiredText(body.title, 200);
    if (!title) {
      return NextResponse.json(
        { error: "Название обязательно" },
        { status: 400 },
      );
    }

    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url || (!url.startsWith("https://") && !url.startsWith("tg://"))) {
      return NextResponse.json(
        { error: "Некорректная ссылка" },
        { status: 400 },
      );
    }

    const description = sanitizeText(body.description, 500) || "";
    const sort =
      typeof body.sort === "number" ? Math.max(0, Math.floor(body.sort)) : 0;

    const [row] = await db
      .insert(chats)
      .values({ title, url, description, sort })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST /api/chats error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
