import type { EventStatus } from "@/constants/domain";
import { db } from "@/db";
import type { Event } from "@/db/schema";
import { Prisma } from "@/generated/prisma/client";

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
  const where: Prisma.EventWhereInput = {};

  const today = new Date().toISOString().slice(0, 10);
  if (filter === "upcoming") {
    where.status = { notIn: ["completed", "cancelled"] };
    where.date = { gte: today };
  } else if (filter === "past") {
    where.OR = [
      { status: { in: ["completed", "cancelled"] } },
      { date: { lt: today } },
    ];
  } else if (filter === "mine" && telegramId) {
    where.registrations = {
      some: {
        user: { telegramId },
      },
    };
  }

  if (search) {
    const searchFilter: Prisma.EventWhereInput = {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    };
    if (where.OR) {
      where.AND = [{ OR: where.OR }, searchFilter];
      delete where.OR;
    } else {
      Object.assign(where, searchFilter);
    }
  }

  const rows = await db.event.findMany({
    where,
    include: {
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { date: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    time: row.time,
    location: row.location,
    coverUrl: row.coverUrl,
    maxParticipants: row.maxParticipants,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    participantCount: row._count.registrations,
  }));
}

export interface CreateEventInput {
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  coverUrl?: string;
  maxParticipants?: number;
  status?: EventStatus;
  createdBy?: number;
}

export async function createEventRecord(
  values: CreateEventInput,
): Promise<Event> {
  return db.event.create({ data: values });
}

export async function getEventWithParticipants(
  eventId: number,
): Promise<EventDetailDto | null> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        include: {
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

export async function getEventById(eventId: number): Promise<Event | null> {
  return db.event.findUnique({
    where: { id: eventId },
  });
}

export async function updateEventById(
  eventId: number,
  updates: UpdateEventInput,
): Promise<Event | null> {
  try {
    return await db.event.update({
      where: { id: eventId },
      data: updates,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}

export async function deleteEventById(eventId: number): Promise<Event | null> {
  try {
    return await db.event.delete({
      where: { id: eventId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}
