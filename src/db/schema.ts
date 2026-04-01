/**
 * Реэкспорт Prisma-типов для обратной совместимости импортов.
 */
export type {
  Chat,
  CommunityRequest,
  Event,
  Registration,
  User,
} from "@/generated/prisma/client";

export {
  CommunityRequestStatus,
  EventStatus,
  UserRole,
} from "@/generated/prisma/client";
