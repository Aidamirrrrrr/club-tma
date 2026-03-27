import type { EventStatus } from "@/constants/domain";

export interface EventListItemResponse {
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
  createdAt: string;
  participantCount: number;
}

export interface EventMutationResponse {
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
  createdAt: string;
}

export interface EventParticipantResponse {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  photoUrl: string;
  registeredAt: string;
}

export interface EventDetailResponse extends EventListItemResponse {
  participants: EventParticipantResponse[];
}
