import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import type { CommunityRequest } from "@/db/schema";
import { communityRequests, users } from "@/db/schema";

type CommunityRequestStatus = "pending" | "reviewed";

export interface CommunityRequestListItem {
  id: number;
  message: string;
  status: CommunityRequestStatus;
  createdAt: Date;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
}

export async function listCommunityRequests(): Promise<
  CommunityRequestListItem[]
> {
  return db
    .select({
      id: communityRequests.id,
      message: communityRequests.message,
      status: communityRequests.status,
      createdAt: communityRequests.createdAt,
      userId: communityRequests.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      photoUrl: users.photoUrl,
    })
    .from(communityRequests)
    .leftJoin(users, eq(communityRequests.userId, users.id))
    .orderBy(desc(communityRequests.createdAt));
}

export async function createCommunityRequest(
  userId: number,
  message: string,
): Promise<CommunityRequest> {
  const [row] = await db
    .insert(communityRequests)
    .values({ userId, message })
    .returning();

  return row;
}

export async function updateCommunityRequestStatus(
  requestId: number,
  status: CommunityRequestStatus,
): Promise<CommunityRequest | undefined> {
  const [updated] = await db
    .update(communityRequests)
    .set({ status })
    .where(eq(communityRequests.id, requestId))
    .returning();

  return updated;
}

export async function deleteCommunityRequestById(
  requestId: number,
): Promise<CommunityRequest | undefined> {
  const [deleted] = await db
    .delete(communityRequests)
    .where(eq(communityRequests.id, requestId))
    .returning();

  return deleted;
}
