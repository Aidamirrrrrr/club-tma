import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { requireAdmin } from "@/lib/telegram";
import {
  isRateLimited,
  sanitizeRequiredText,
  sanitizeText,
} from "@/lib/validation";

/** PATCH /api/chats/[id] — обновить чат (админ). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`chats:update:${auth.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId < 1) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = sanitizeRequiredText(body.title, 200);
      if (!title) {
        return NextResponse.json(
          { error: "Название обязательно" },
          { status: 400 },
        );
      }
      updates.title = title;
    }

    if (body.url !== undefined) {
      const url = typeof body.url === "string" ? body.url.trim() : "";
      if (!url || (!url.startsWith("https://") && !url.startsWith("tg://"))) {
        return NextResponse.json(
          { error: "Некорректная ссылка" },
          { status: 400 },
        );
      }
      updates.url = url;
    }

    if (body.description !== undefined) {
      updates.description = sanitizeText(body.description, 500) || "";
    }

    if (body.sort !== undefined) {
      updates.sort =
        typeof body.sort === "number" ? Math.max(0, Math.floor(body.sort)) : 0;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(chats)
      .set(updates)
      .where(eq(chats.id, numId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/chats/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** DELETE /api/chats/[id] — удалить чат (админ). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`chats:delete:${auth.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId < 1) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(chats)
      .where(eq(chats.id, numId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/chats/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
