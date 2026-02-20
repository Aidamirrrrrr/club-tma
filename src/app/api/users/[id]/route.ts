import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, requireAuth } from "@/lib/telegram";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await db.query.users.findFirst({
      where: eq(users.id, Number(id)),
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Admin-only fields
    const hasAdminFields = "role" in body || "blocked" in body;
    if (hasAdminFields) {
      const auth = await requireAdmin(request);
      if (auth.error) return auth.error;
    } else {
      // Regular users can only edit their own profile
      const auth = await requireAuth(request);
      if (auth.error) return auth.error;
      if (auth.user.id !== Number(id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "bio",
      "instagram",
      "telegram",
      "phone",
      "photoUrl",
      "role",
      "blocked",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
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
      .where(eq(users.id, Number(id)))
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
