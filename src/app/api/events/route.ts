import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/telegram";
import { notifyNewEvent } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "upcoming";
    const search = searchParams.get("search") || "";

    const allEvents = await db.query.events.findMany({
      with: {
        registrations: true,
      },
      orderBy: [asc(events.date)],
    });

    let filtered = allEvents.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      time: e.time,
      location: e.location,
      coverUrl: e.coverUrl,
      maxParticipants: e.maxParticipants,
      status: e.status,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      participantCount: e.registrations.length,
    }));

    if (filter === "upcoming") {
      filtered = filtered.filter(
        (e) => e.status !== "completed" && e.status !== "cancelled",
      );
    } else if (filter === "past") {
      filtered = filtered.filter(
        (e) => e.status === "completed" || e.status === "cancelled",
      );
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q),
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();

    const [event] = await db
      .insert(events)
      .values({
        title: body.title,
        description: body.description || "",
        date: body.date,
        time: body.time || "",
        location: body.location || "",
        coverUrl: body.coverUrl || "",
        maxParticipants: body.maxParticipants || 0,
        status: body.status || "open",
        createdBy: body.createdBy,
      })
      .returning();

    // Notify admins (fire-and-forget)
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
