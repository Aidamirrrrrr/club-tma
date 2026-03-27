import { and, eq, ilike, or } from "drizzle-orm";
import type { UserRole } from "@/constants/domain";
import { db } from "@/db";
import type { User } from "@/db/schema";
import { users } from "@/db/schema";

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
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.username, `%${search}%`),
      ),
    );
  }

  if (role === "admin") {
    conditions.push(eq(users.role, "admin"));
  }

  conditions.push(eq(users.blocked, includeBlocked));

  const where =
    conditions.length > 1
      ? and(...conditions)
      : conditions.length === 1
        ? conditions[0]
        : undefined;

  return db.query.users.findMany({
    where,
    columns: {
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
      profileGradient: true,
      createdAt: true,
    },
    orderBy: (table, { asc }) => [asc(table.firstName)],
  });
}

export async function getUserWithEvents(
  userId: number,
): Promise<UserDetailDto | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      registrations: {
        with: {
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
): Promise<User | undefined> {
  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();

  return updated;
}
