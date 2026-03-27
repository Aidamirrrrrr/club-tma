import { and, asc, count, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import type { EventStatus } from "@/constants/domain";
import { db } from "@/db";
import type { Event } from "@/db/schema";
import { events, registrations, users } from "@/db/schema";

interface ListEventsParams {
  filter: "upcoming" | "past" | "mine";
  search: string;
  telegramId: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  coverUrl?: string;
  maxParticipants?: number;
  status?: EventStatus;
}

export interface EventListItem {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  coverUrl: string | null;
  maxParticipants: number | null;
  status: EventStatus;
  createdBy: number | null;
  createdAt: Date;
  participantCount: number;
}

export interface EventParticipantDto {
  id: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  registeredAt: Date;
}

export interface EventDetailDto extends Omit<Event, "createdAt"> {
  createdAt: Date;
  participants: EventParticipantDto[];
  participantCount: number;
}

export async function listEvents({
  filter,
  search,
  telegramId,
}: ListEventsParams): Promise<EventListItem[]> {
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

  return db
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
}

export async function createEventRecord(
  values: typeof events.$inferInsert,
): Promise<Event> {
  const [event] = await db.insert(events).values(values).returning();
  return event;
}

export async function getEventWithParticipants(
  eventId: number,
): Promise<EventDetailDto | null> {
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
    return null;
  }

  const participants = event.registrations.map((registration) => ({
    id: registration.user.id,
    firstName: registration.user.firstName,
    lastName: registration.user.lastName,
    username: registration.user.username,
    photoUrl: registration.user.photoUrl,
    registeredAt: registration.createdAt,
  }));

  const { registrations: _, ...eventData } = event;
  return {
    ...eventData,
    participants,
    participantCount: participants.length,
  };
}

export async function getEventById(
  eventId: number,
): Promise<Event | undefined> {
  return db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
}

export async function updateEventById(
  eventId: number,
  updates: UpdateEventInput,
): Promise<Event | undefined> {
  const [updated] = await db
    .update(events)
    .set(updates)
    .where(eq(events.id, eventId))
    .returning();

  return updated;
}

export async function deleteEventById(
  eventId: number,
): Promise<Event | undefined> {
  const [deleted] = await db
    .delete(events)
    .where(eq(events.id, eventId))
    .returning();

  return deleted;
}
