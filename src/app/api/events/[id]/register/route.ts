import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, registrations } from "@/db/schema";
import { notifyRegistration } from "@/lib/notifications";
import { requireAuth } from "@/lib/telegram";
import { isRateLimited, parseId } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const eventId = parseId(id);
    if (Number.isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    // Rate limit: 30 registration actions per minute per user
    if (isRateLimited(`register:${auth.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const userId = auth.user.id;

    // Fetch event and check status
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "open") {
      return NextResponse.json(
        { error: "Регистрация закрыта" },
        { status: 400 },
      );
    }

    // Check max participants
    if (event.maxParticipants && event.maxParticipants > 0) {
      const [{ value: currentCount }] = await db
        .select({ value: count() })
        .from(registrations)
        .where(eq(registrations.eventId, eventId));

      if (currentCount >= event.maxParticipants) {
        return NextResponse.json(
          { error: "Все места заняты" },
          { status: 400 },
        );
      }
    }

    // Check if already registered
    const existing = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.userId, userId),
        eq(registrations.eventId, eventId),
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already registered" },
        { status: 409 },
      );
    }

    const [reg] = await db
      .insert(registrations)
      .values({ userId, eventId })
      .returning();

    // Send notification (fire-and-forget)
    notifyRegistration(auth.user, event).catch(console.error);

    return NextResponse.json(reg, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
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
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const eventId = parseId(id);
    if (Number.isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(registrations)
      .where(
        and(
          eq(registrations.userId, auth.user.id),
          eq(registrations.eventId, eventId),
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unregister error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
