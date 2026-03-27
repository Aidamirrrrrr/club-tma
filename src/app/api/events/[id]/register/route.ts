import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { parseId } from "@/lib/validation-rules";
import { requireAuth } from "@/server/auth/telegram";
import { notifyRegistration } from "@/server/notifications/telegram";
import {
  registerForEvent,
  unregisterFromEvent,
} from "@/server/services/event-registration";

/** POST /api/events/:id/register — регистрация на мероприятие. */
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

    if (isRateLimited(`register:${auth.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const result = await registerForEvent(auth.user.id, eventId);

    if (result.status === "not_found") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (result.status === "closed") {
      return NextResponse.json(
        { error: "Регистрация закрыта" },
        { status: 400 },
      );
    }

    if (result.status === "duplicate") {
      return NextResponse.json(
        { error: "Already registered" },
        { status: 409 },
      );
    }

    if (result.status === "full") {
      return NextResponse.json({ error: "Все места заняты" }, { status: 400 });
    }

    notifyRegistration(auth.user, result.event).catch(console.error);

    return NextResponse.json(result.registration, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** DELETE /api/events/:id/register — отмена регистрации. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`unregister:${auth.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const eventId = parseId(id);
    if (Number.isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const result = await unregisterFromEvent(auth.user.id, eventId);

    if (result.status === "not_found") {
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
