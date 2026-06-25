import type { LoyaltyOfferResponse } from "@/contracts/loyalty";
import type { LoyaltyOffer } from "@/db/schema";

export function serializeLoyaltyOffer(
  offer: LoyaltyOffer,
): LoyaltyOfferResponse {
  return {
    id: offer.id,
    title: offer.title,
    discountLabel: offer.discountLabel,
    coverUrl: offer.coverUrl,
    logoUrl: offer.logoUrl,
    qrUrl: offer.qrUrl,
    status: offer.status,
    createdBy: offer.createdBy,
    createdAt: offer.createdAt.toISOString(),
  };
}
