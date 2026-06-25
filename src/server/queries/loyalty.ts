import type { LoyaltyStatus } from "@/constants/domain";
import { db } from "@/db";
import type { LoyaltyOffer } from "@/db/schema";
import { Prisma } from "@/generated/prisma/client";

interface ListLoyaltyOffersParams {
  includeHidden: boolean;
}

export interface CreateLoyaltyOfferInput {
  title: string;
  discountLabel?: string;
  coverUrl?: string;
  logoUrl?: string;
  qrUrl?: string;
  status?: LoyaltyStatus;
  createdBy?: number;
}

export interface UpdateLoyaltyOfferInput {
  title?: string;
  discountLabel?: string;
  coverUrl?: string;
  logoUrl?: string;
  qrUrl?: string;
  status?: LoyaltyStatus;
}

export async function listLoyaltyOffers({
  includeHidden,
}: ListLoyaltyOffersParams): Promise<LoyaltyOffer[]> {
  return db.loyaltyOffer.findMany({
    where: includeHidden ? {} : { status: "active" },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLoyaltyOfferRecord(
  values: CreateLoyaltyOfferInput,
): Promise<LoyaltyOffer> {
  return db.loyaltyOffer.create({ data: values });
}

export async function getLoyaltyOfferById(
  offerId: number,
): Promise<LoyaltyOffer | null> {
  return db.loyaltyOffer.findUnique({
    where: { id: offerId },
  });
}

export async function updateLoyaltyOfferById(
  offerId: number,
  updates: UpdateLoyaltyOfferInput,
): Promise<LoyaltyOffer | null> {
  try {
    return await db.loyaltyOffer.update({
      where: { id: offerId },
      data: updates,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}

export async function deleteLoyaltyOfferById(
  offerId: number,
): Promise<LoyaltyOffer | null> {
  try {
    return await db.loyaltyOffer.delete({
      where: { id: offerId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}
