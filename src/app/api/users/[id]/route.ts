import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin, requireAuth } from "@/lib/telegram";
import {
  isOneOf,
  parseId,
  sanitizeHandle,
  sanitizePhone,
  sanitizeText,
  sanitizeUrl,
  USER_ROLES,
} from "@/lib/validation";

/** GET /api/users/:id — профиль пользователя с историей мероприятий. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const userId = parseId(id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        registrations: {
          with: {
            event: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userEvents = user.registrations.map((r) => ({
      eventId: r.event.id,
      eventTitle: r.event.title,
      eventDate: r.event.date,
      eventTime: r.event.time,
      eventStatus: r.event.status,
    }));

    const { registrations: _, ...userData } = user;
    return NextResponse.json({ ...userData, events: userEvents });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** PATCH /api/users/:id — обновление профиля (свой) или управление (админ). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const targetId = parseId(id);
    if (Number.isNaN(targetId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();

    const hasAdminFields = "role" in body || "blocked" in body;

    if (hasAdminFields) {
      const auth = await requireAdmin(request);
      if (auth.error) return auth.error;

      if (auth.user.id === targetId) {
        return NextResponse.json(
          { error: "Cannot modify your own admin status" },
          { status: 400 },
        );
      }
    } else {

      const auth = await requireAuth(request);
      if (auth.error) return auth.error;
      if (auth.user.id !== targetId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updates: Record<string, unknown> = {};

    if ("firstName" in body) {
      const v = sanitizeText(body.firstName, 100);
      if (v) updates.firstName = v;
    }
    if ("lastName" in body) {
      updates.lastName = sanitizeText(body.lastName, 100) || "";
    }
    if ("bio" in body) {
      updates.bio = sanitizeText(body.bio, 1000) || "";
    }
    if ("instagram" in body) {
      updates.instagram = sanitizeHandle(body.instagram, 64);
    }
    if ("telegram" in body) {
      updates.telegram = sanitizeHandle(body.telegram, 64);
    }
    if ("phone" in body) {
      updates.phone = sanitizePhone(body.phone, 30);
    }
    if ("photoUrl" in body) {
      updates.photoUrl = sanitizeUrl(body.photoUrl);
    }
    if ("profileGradient" in body) {
      const val = body.profileGradient;

      if (val === "default") {
        updates.profileGradient = "default";
      } else {
        updates.profileGradient = sanitizeUrl(val) || "default";
      }
    }

    if ("role" in body && hasAdminFields) {
      if (!isOneOf(body.role, USER_ROLES)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = body.role;
    }
    if ("blocked" in body && hasAdminFields) {
      if (typeof body.blocked !== "boolean") {
        return NextResponse.json(
          { error: "blocked must be a boolean" },
          { status: 400 },
        );
      }
      updates.blocked = body.blocked;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, targetId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
