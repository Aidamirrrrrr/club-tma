import type { LoyaltyStatus } from "@/constants/domain";
import type { LoyaltyOfferResponse } from "@/contracts/loyalty";

export type LoyaltyOffer = LoyaltyOfferResponse;

export interface LoyaltyFormData {
  title: string;
  discountLabel: string;
  coverUrl: string;
  logoUrl: string;
  qrUrl: string;
  status: LoyaltyStatus;
}
