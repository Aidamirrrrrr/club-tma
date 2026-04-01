import type {
  UserDetailResponse,
  UserListItemResponse,
  UserMutationResponse,
} from "@/contracts/users";
import type { User } from "@/db/schema";
import type { UserDetailDto, UserListItem } from "@/server/queries/users";

export function serializeUserListItem(
  user: UserListItem,
): UserListItemResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName || "",
    username: user.username || "",
    photoUrl: user.photoUrl || "",
    bio: user.bio || "",
    instagram: user.instagram || "",
    telegram: user.telegram || "",
    phone: user.phone || "",
    role: user.role,
    isTeam: user.isTeam,
    profileGradient: user.profileGradient || "default",
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializeUserDetail(user: UserDetailDto): UserDetailResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName || "",
    username: user.username || "",
    photoUrl: user.photoUrl || "",
    bio: user.bio || "",
    instagram: user.instagram || "",
    telegram: user.telegram || "",
    phone: user.phone || "",
    role: user.role,
    isTeam: user.isTeam,
    profileGradient: user.profileGradient || "default",
    createdAt: user.createdAt.toISOString(),
    telegramId: user.telegramId,
    blocked: user.blocked,
    events: user.events.map((event) => ({
      eventId: event.eventId,
      eventTitle: event.eventTitle,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      eventStatus: event.eventStatus,
    })),
  };
}

export function serializeUserMutation(user: User): UserMutationResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName || "",
    username: user.username || "",
    photoUrl: user.photoUrl || "",
    bio: user.bio || "",
    instagram: user.instagram || "",
    telegram: user.telegram || "",
    phone: user.phone || "",
    role: user.role,
    isTeam: user.isTeam,
    profileGradient: user.profileGradient || "default",
    createdAt: user.createdAt.toISOString(),
    telegramId: user.telegramId,
    blocked: user.blocked,
  };
}
