import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/telegram";
import { notifyEventStatusChange } from "@/lib/notifications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        registrations: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const participants = event.registrations.map((r) => ({
      id: r.user.id,
      firstName: r.user.firstName,
      lastName: r.user.lastName,
      username: r.user.username,
      photoUrl: r.user.photoUrl,
      registeredAt: r.createdAt,
    }));

    const { registrations: _, ...eventData } = event;
    return NextResponse.json({
      ...eventData,
      participants,
      participantCount: participants.length,
    });
  } catch (error) {
    console.error("Event fetch error:", error);
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
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "title",
      "description",
      "date",
      "time",
      "location",
      "coverUrl",
      "maxParticipants",
      "status",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    // Fetch old event to detect status change
    const oldEvent = await db.query.events.findFirst({
      where: eq(events.id, Number(id)),
    });

    const [updated] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Notify on status change
    if (oldEvent && "status" in updates && oldEvent.status !== updated.status) {
      notifyEventStatusChange(updated, updated.status).catch(console.error);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const [deleted] = await db
      .delete(events)
      .where(eq(events.id, Number(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
