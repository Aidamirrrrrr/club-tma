import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { events, registrations } from "@/db/schema";

export async function registerForEvent(userId: number, eventId: number) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    return { status: "not_found" as const };
  }

  if (event.status !== "open") {
    return { status: "closed" as const };
  }

  const registration = await db.transaction(async (tx) => {
    const existing = await tx.query.registrations.findFirst({
      where: and(
        eq(registrations.userId, userId),
        eq(registrations.eventId, eventId),
      ),
    });

    if (existing) {
      return "duplicate" as const;
    }

    if (event.maxParticipants && event.maxParticipants > 0) {
      const [{ value: currentCount }] = await tx
        .select({ value: count() })
        .from(registrations)
        .where(eq(registrations.eventId, eventId));

      if (currentCount >= event.maxParticipants) {
        return "full" as const;
      }
    }

    const [inserted] = await tx
      .insert(registrations)
      .values({ userId, eventId })
      .returning();
    return inserted;
  });

  if (registration === "duplicate") {
    return { status: "duplicate" as const, event };
  }

  if (registration === "full") {
    return { status: "full" as const, event };
  }

  return {
    status: "created" as const,
    event,
    registration,
  };
}

export async function unregisterFromEvent(userId: number, eventId: number) {
  const [deleted] = await db
    .delete(registrations)
    .where(
      and(eq(registrations.userId, userId), eq(registrations.eventId, eventId)),
    )
    .returning();

  if (!deleted) {
    return { status: "not_found" as const };
  }

  return { status: "deleted" as const, registration: deleted };
}
