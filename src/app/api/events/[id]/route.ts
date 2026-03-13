import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { notifyEventStatusChange } from "@/lib/notifications";
import { requireAdmin, requireAuth } from "@/lib/telegram";
import {
  EVENT_STATUSES,
  isOneOf,
  isRateLimited,
  isValidDate,
  isValidTime,
  parseId,
  parseIntClamped,
  sanitizeRequiredText,
  sanitizeText,
  sanitizeUrl,
} from "@/lib/validation";

/** GET /api/events/:id — детали мероприятия с участниками. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`events:get:${auth.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const eventId = parseId(id);
    if (Number.isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

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

/** PATCH /api/events/:id — обновление мероприятия (только админ). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`events:update:${auth.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const eventId = parseId(id);
    if (Number.isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const body = await request.json();

    const updates: Record<string, unknown> = {};

    if ("title" in body) {
      const title = sanitizeRequiredText(body.title, 200);
      if (!title) {
        return NextResponse.json(
          { error: "Title cannot be empty (max 200 chars)" },
          { status: 400 },
        );
      }
      updates.title = title;
    }
    if ("description" in body) {
      updates.description = sanitizeText(body.description, 5000) || "";
    }
    if ("date" in body) {
      if (!isValidDate(body.date)) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 },
        );
      }
      updates.date = body.date;
    }
    if ("time" in body) {
      if (!isValidTime(body.time)) {
        return NextResponse.json(
          { error: "Invalid time format" },
          { status: 400 },
        );
      }
      updates.time = body.time;
    }
    if ("location" in body) {
      updates.location = sanitizeText(body.location, 500) || "";
    }
    if ("coverUrl" in body) {
      updates.coverUrl = sanitizeUrl(body.coverUrl);
    }
    if ("maxParticipants" in body) {
      updates.maxParticipants = parseIntClamped(
        body.maxParticipants,
        0,
        10000,
        0,
      );
    }
    if ("status" in body) {
      if (!isOneOf(body.status, EVENT_STATUSES)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const oldEvent = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    const [updated] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, eventId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

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

/** DELETE /api/events/:id — удаление мероприятия (только админ). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`events:delete:${auth.user.id}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const eventId = parseId(id);
    if (Number.isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(events)
      .where(eq(events.id, eventId))
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
