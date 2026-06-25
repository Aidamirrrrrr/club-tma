export const EVENT_STATUSES = [
  "open",
  "closed",
  "cancelled",
  "completed",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LOYALTY_STATUSES = ["active", "hidden"] as const;
export type LoyaltyStatus = (typeof LOYALTY_STATUSES)[number];
