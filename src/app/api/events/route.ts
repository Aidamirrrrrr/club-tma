import { and, asc, count, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, registrations, users } from "@/db/schema";
import { notifyNewEvent } from "@/lib/notifications";
import { requireAdmin, requireAuth } from "@/lib/telegram";
import {
  EVENT_STATUSES,
  escapeLikePattern,
  isOneOf,
  isRateLimited,
  isValidDate,
  isValidTime,
  parseIntClamped,
  sanitizeRequiredText,
  sanitizeText,
  sanitizeUrl,
} from "@/lib/validation";

/** GET /api/events — список мероприятий с фильтрацией и поиском. */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`events:list:${auth.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "upcoming";
    const rawSearch = searchParams.get("search") || "";
    const search = escapeLikePattern(rawSearch).slice(0, 200);
    const telegramId = searchParams.get("telegramId") || "";

    const conditions = [];

    const today = new Date().toISOString().slice(0, 10);
    if (filter === "upcoming") {
      conditions.push(
        and(
          ne(events.status, "completed"),
          ne(events.status, "cancelled"),
          sql`${events.date} >= ${today}`,
        ),
      );
    } else if (filter === "past") {
      conditions.push(
        or(
          eq(events.status, "completed"),
          eq(events.status, "cancelled"),
          sql`${events.date} < ${today}`,
        ),
      );
    } else if (filter === "mine" && telegramId) {
      const userEvents = db
        .select({ eventId: registrations.eventId })
        .from(registrations)
        .innerJoin(users, eq(users.id, registrations.userId))
        .where(eq(users.telegramId, telegramId));
      conditions.push(inArray(events.id, userEvents));
    }

    if (search) {
      conditions.push(
        or(
          ilike(events.title, `%${search}%`),
          ilike(events.description, `%${search}%`),
        ),
      );
    }

    const where =
      conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
          ? conditions[0]
          : undefined;

    const participantCountSq = db
      .select({
        eventId: registrations.eventId,
        count: count().as("count"),
      })
      .from(registrations)
      .groupBy(registrations.eventId)
      .as("pc");

    const result = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        time: events.time,
        location: events.location,
        coverUrl: events.coverUrl,
        maxParticipants: events.maxParticipants,
        status: events.status,
        createdBy: events.createdBy,
        createdAt: events.createdAt,
        participantCount: sql<number>`COALESCE(${participantCountSq.count}, 0)`,
      })
      .from(events)
      .leftJoin(participantCountSq, eq(events.id, participantCountSq.eventId))
      .where(where)
      .orderBy(asc(events.date));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/events — создание мероприятия (только админ). */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`event-create:${auth.user.id}`, 20, 3600_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();

    const title = sanitizeRequiredText(body.title, 200);
    if (!title) {
      return NextResponse.json(
        { error: "Title is required (max 200 chars)" },
        { status: 400 },
      );
    }

    if (!isValidDate(body.date)) {
      return NextResponse.json(
        { error: "Valid date (YYYY-MM-DD) is required" },
        { status: 400 },
      );
    }

    if (body.time && !isValidTime(body.time)) {
      return NextResponse.json(
        { error: "Invalid time format (HH:MM)" },
        { status: 400 },
      );
    }

    const status =
      body.status && isOneOf(body.status, EVENT_STATUSES)
        ? body.status
        : "open";

    const [event] = await db
      .insert(events)
      .values({
        title,
        description: sanitizeText(body.description, 5000) || "",
        date: body.date,
        time: body.time || "",
        location: sanitizeText(body.location, 500) || "",
        coverUrl: sanitizeUrl(body.coverUrl),
        maxParticipants: parseIntClamped(body.maxParticipants, 0, 10000, 0),
        status,
        createdBy: auth.user.id,
      })
      .returning();

    notifyNewEvent(event).catch(console.error);

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Event create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
