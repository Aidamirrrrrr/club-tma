import { db } from "@/db";
import type { CommunityRequest } from "@/db/schema";

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
  const rows = await db.communityRequest.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          username: true,
          photoUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt,
    userId: row.userId,
    firstName: row.user.firstName,
    lastName: row.user.lastName ?? null,
    username: row.user.username ?? null,
    photoUrl: row.user.photoUrl ?? null,
  }));
}

export async function createCommunityRequest(
  userId: number,
  message: string,
): Promise<CommunityRequest> {
  return db.communityRequest.create({
    data: { userId, message },
  });
}

export async function updateCommunityRequestStatus(
  requestId: number,
  status: CommunityRequestStatus,
): Promise<CommunityRequest | null> {
  return db.communityRequest.update({
    where: { id: requestId },
    data: { status },
  });
}

export async function deleteCommunityRequestById(
  requestId: number,
): Promise<CommunityRequest | null> {
  return db.communityRequest.delete({
    where: { id: requestId },
  });
}
