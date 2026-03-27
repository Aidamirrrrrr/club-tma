import type { UserDetailResponse, UserEventResponse } from "@/contracts/users";

export type ProfileEvent = UserEventResponse;
export type ProfileData = UserDetailResponse;

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
  instagram: string;
  telegram: string;
  phone: string;
  photoUrl: string;
  profileGradient: string;
}
