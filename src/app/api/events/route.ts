import { NextResponse } from "next/server";
import { EVENT_STATUSES } from "@/constants/domain";
import { isRateLimited } from "@/lib/rate-limit";
import {
  escapeLikePattern,
  sanitizeRequiredText,
  sanitizeText,
  sanitizeUrl,
} from "@/lib/sanitize";
import {
  isOneOf,
  isValidDate,
  isValidTime,
  parseIntClamped,
} from "@/lib/validation-rules";
import { requireAdmin, requireAuth } from "@/server/auth/telegram";
import { notifyNewEvent } from "@/server/notifications/telegram";
import { createEventRecord, listEvents } from "@/server/queries/events";
import {
  serializeEventListItem,
  serializeEventMutation,
} from "@/server/serializers/events";

/** GET /api/events — список мероприятий с фильтрацией и поиском. */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`events:list:${auth.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const filterParam = searchParams.get("filter");
    const filter =
      filterParam === "past" || filterParam === "mine"
        ? filterParam
        : "upcoming";
    const rawSearch = searchParams.get("search") || "";
    const search = escapeLikePattern(rawSearch).slice(0, 200);
    const telegramId = searchParams.get("telegramId") || "";

    const result = await listEvents({ filter, search, telegramId });

    return NextResponse.json(result.map(serializeEventListItem));
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

    const coverUrl = sanitizeUrl(body.coverUrl) || undefined;

    const status =
      body.status && isOneOf(body.status, EVENT_STATUSES)
        ? body.status
        : "open";

    const event = await createEventRecord({
      title,
      description: sanitizeText(body.description, 5000) || "",
      date: body.date,
      time: body.time || "",
      location: sanitizeText(body.location, 500) || "",
      coverUrl,
      maxParticipants: parseIntClamped(body.maxParticipants, 0, 10000, 0),
      status,
      createdBy: auth.user.id,
    });

    notifyNewEvent(event).catch(console.error);

    return NextResponse.json(serializeEventMutation(event), { status: 201 });
  } catch (error) {
    console.error("Event create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
