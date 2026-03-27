export interface CommunityRequestItemResponse {
  id: number;
  message: string;
  status: "pending" | "reviewed";
  createdAt: string;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
}

export interface CommunityRequestMutationResponse {
  id: number;
  message: string;
  status: "pending" | "reviewed";
  createdAt: string;
  userId: number;
}
