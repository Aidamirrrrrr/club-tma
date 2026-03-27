import { db } from "@/db";

export async function registerForEvent(userId: number, eventId: number) {
  const event = await db.event.findUnique({ where: { id: eventId } });

  if (!event) {
    return { status: "not_found" as const };
  }

  if (event.status !== "open") {
    return { status: "closed" as const };
  }

  const registration = await db.$transaction(async (tx) => {
    const existing = await tx.registration.findFirst({
      where: { userId, eventId },
    });

    if (existing) {
      return "duplicate" as const;
    }

    if (event.maxParticipants && event.maxParticipants > 0) {
      const currentCount = await tx.registration.count({
        where: { eventId },
      });

      if (currentCount >= event.maxParticipants) {
        return "full" as const;
      }
    }

    return tx.registration.create({
      data: { userId, eventId },
    });
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
  const existing = await db.registration.findFirst({
    where: { userId, eventId },
  });

  if (!existing) {
    return { status: "not_found" as const };
  }

  const deleted = await db.registration.delete({
    where: { id: existing.id },
  });

  return { status: "deleted" as const, registration: deleted };
}
