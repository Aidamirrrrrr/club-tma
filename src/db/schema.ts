/**
 * Реэкспорт Prisma-типов для обратной совместимости импортов.
 */
export type {
  Chat,
  CommunityRequest,
  Event,
  LoyaltyOffer,
  Registration,
  User,
} from "@/generated/prisma/client";

export {
  CommunityRequestStatus,
  EventStatus,
  LoyaltyStatus,
  UserRole,
} from "@/generated/prisma/client";
