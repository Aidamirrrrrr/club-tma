import type { EventStatus, UserRole } from "@/constants/domain";

export interface UserListItemResponse {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  photoUrl: string;
  bio: string;
  instagram: string;
  telegram: string;
  phone: string;
  role: UserRole;
  isTeam: boolean;
  profileGradient: string;
  createdAt: string;
}

export interface UserMutationResponse extends UserListItemResponse {
  telegramId: string;
  blocked: boolean;
}

export interface UserEventResponse {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventStatus: EventStatus;
}

export interface UserDetailResponse extends UserListItemResponse {
  telegramId: string;
  blocked: boolean;
  events: UserEventResponse[];
}
