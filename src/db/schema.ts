/**
 * Реэкспорт Prisma-типов для обратной совместимости импортов.
 */
export type {
  User,
  Event,
  Registration,
  CommunityRequest,
  Chat,
} from "@/generated/prisma/client";

export {
  UserRole,
  EventStatus,
  CommunityRequestStatus,
} from "@/generated/prisma/client";
