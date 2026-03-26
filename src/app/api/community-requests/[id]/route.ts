import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { communityRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/telegram";
import { isOneOf, isRateLimited } from "@/lib/validation";

const ALLOWED_STATUSES = ["pending", "reviewed"] as const;

/** PATCH /api/community-requests/[id] — обновить статус запроса (админ). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (
      isRateLimited(`community-requests:update:${auth.user.id}`, 30, 60_000)
    ) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId < 1) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    if (!isOneOf(body.status, ALLOWED_STATUSES)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [updated] = await db
      .update(communityRequests)
      .set({ status: body.status })
      .where(eq(communityRequests.id, numId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/community-requests/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** DELETE /api/community-requests/[id] — удалить запрос (админ). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (
      isRateLimited(`community-requests:delete:${auth.user.id}`, 30, 60_000)
    ) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId < 1) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(communityRequests)
      .where(eq(communityRequests.id, numId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/community-requests/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
