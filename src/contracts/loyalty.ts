import type { LoyaltyStatus } from "@/constants/domain";

export interface LoyaltyOfferResponse {
  id: number;
  title: string;
  discountLabel: string;
  coverUrl: string | null;
  logoUrl: string | null;
  qrUrl: string | null;
  status: LoyaltyStatus;
  createdBy: number | null;
  createdAt: string;
}
