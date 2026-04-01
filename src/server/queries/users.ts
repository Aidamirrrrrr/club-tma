import type { UserRole } from "@/constants/domain";
import { db } from "@/db";
import type { User } from "@/db/schema";
import { Prisma } from "@/generated/prisma/client";

interface ListUsersParams {
  search: string;
  role: "" | "admin";
  includeBlocked: boolean;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  instagram?: string;
  telegram?: string;
  phone?: string;
  photoUrl?: string;
  profileGradient?: string;
  role?: UserRole;
  isTeam?: boolean;
  blocked?: boolean;
}

export interface UserListItem {
  id: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  bio: string | null;
  instagram: string | null;
  telegram: string | null;
  phone: string | null;
  role: UserRole;
  isTeam: boolean;
  profileGradient: string | null;
  createdAt: Date;
}

export interface UserEventDto {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventStatus: "open" | "closed" | "cancelled" | "completed";
}

export interface UserDetailDto extends User {
  events: UserEventDto[];
}

export async function listUsers({
  search,
  role,
  includeBlocked,
}: ListUsersParams): Promise<UserListItem[]> {
  const where: Prisma.UserWhereInput = {
    blocked: includeBlocked,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role === "admin") {
    where.role = "admin";
  }

  return db.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      photoUrl: true,
      bio: true,
      instagram: true,
      telegram: true,
      phone: true,
      role: true,
      isTeam: true,
      profileGradient: true,
      createdAt: true,
    },
    orderBy: { firstName: "asc" },
  });
}

export async function getUserWithEvents(
  userId: number,
): Promise<UserDetailDto | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      registrations: {
        include: {
          event: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const userEvents = user.registrations.map((registration) => ({
    eventId: registration.event.id,
    eventTitle: registration.event.title,
    eventDate: registration.event.date,
    eventTime: registration.event.time,
    eventStatus: registration.event.status,
  }));

  const { registrations: _, ...userData } = user;
  return { ...userData, events: userEvents };
}

export async function updateUserById(
  userId: number,
  updates: UpdateUserInput,
): Promise<User | null> {
  try {
    return await db.user.update({
      where: { id: userId },
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
