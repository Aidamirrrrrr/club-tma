import { Pencil, Store, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LoyaltyOffer } from "@/features/loyalty/types";

interface LoyaltyCardProps {
  offer: LoyaltyOffer;
  isAdmin?: boolean;
  onDelete?: (offer: LoyaltyOffer) => void;
  className?: string;
}

export function LoyaltyCard({
  offer,
  isAdmin,
  onDelete,
  className,
}: LoyaltyCardProps) {
  return (
    <Card
      className={`relative flex h-full w-full gap-0 overflow-hidden p-0${className ? ` ${className}` : ""}`}
    >
      {/* Фото партнёра */}
      <div className="relative w-2/5 shrink-0">
        {offer.coverUrl ? (
          <Image
            src={offer.coverUrl}
            alt={offer.title}
            width={400}
            height={600}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full min-h-40 w-full items-center justify-center bg-linear-to-br from-primary/40 to-background">
            <Store className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {offer.logoUrl && (
              <div className="relative h-9 w-24">
                <Image
                  src={offer.logoUrl}
                  alt={`${offer.title} логотип`}
                  fill
                  className="object-contain object-left"
                  unoptimized
                />
              </div>
            )}
            <p className="text-sm font-semibold leading-tight tracking-tight">
              {offer.title}
            </p>
            {offer.discountLabel && (
              <Badge variant="outline" className="w-fit uppercase">
                {offer.discountLabel}
              </Badge>
            )}
            {offer.status === "hidden" && (
              <Badge variant="secondary" className="w-fit">
                Скрыта
              </Badge>
            )}
          </div>
        </div>

        {/* QR-код */}
        {offer.qrUrl && (
          <div className="mt-auto flex justify-center pt-1">
            <div className="relative aspect-square w-32 max-w-full overflow-hidden rounded-lg bg-white p-1.5">
              <Image
                src={offer.qrUrl}
                alt={`${offer.title} QR-код`}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        )}
      </div>

      {/* Админ-управление */}
      {isAdmin && (
        <div className="absolute right-2.5 top-2.5 flex gap-1.5">
          <Link href={`/loyalty/${offer.id}/edit`}>
            <Button type="button" size="icon-sm" variant="secondary">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            onClick={() => onDelete?.(offer)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}
