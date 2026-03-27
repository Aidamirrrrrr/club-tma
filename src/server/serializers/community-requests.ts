import type {
  CommunityRequestItemResponse,
  CommunityRequestMutationResponse,
} from "@/contracts/community-requests";
import type { CommunityRequest } from "@/db/schema";
import type { CommunityRequestListItem } from "@/server/queries/community-requests";

export function serializeCommunityRequest(
  request: CommunityRequestListItem,
): CommunityRequestItemResponse {
  return {
    id: request.id,
    message: request.message,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    userId: request.userId,
    firstName: request.firstName,
    lastName: request.lastName,
    username: request.username,
    photoUrl: request.photoUrl,
  };
}

export function serializeCommunityRequestMutation(
  request: CommunityRequest,
): CommunityRequestMutationResponse {
  return {
    id: request.id,
    message: request.message,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    userId: request.userId,
  };
}
