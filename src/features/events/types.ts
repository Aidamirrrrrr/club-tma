import type { EventStatus } from "@/constants/domain";
import type {
  EventDetailResponse,
  EventListItemResponse,
  EventParticipantResponse,
} from "@/contracts/events";

export type EventPreview = EventListItemResponse;
export type EventParticipant = EventParticipantResponse;
export type EventDetail = EventDetailResponse;

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  coverUrl: string;
  maxParticipants: string;
  status: EventStatus;
}
