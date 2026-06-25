-- CreateEnum
CREATE TYPE "LoyaltyStatus" AS ENUM ('active', 'hidden');

-- CreateTable
CREATE TABLE "loyalty_offers" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "discount_label" TEXT NOT NULL DEFAULT '',
    "cover_url" TEXT,
    "logo_url" TEXT,
    "qr_url" TEXT,
    "status" "LoyaltyStatus" NOT NULL DEFAULT 'active',
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_offers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "loyalty_offers" ADD CONSTRAINT "loyalty_offers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
