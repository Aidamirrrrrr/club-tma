"use client";

import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { useTelegram } from "@/integrations/telegram";

/** Страница «Программа лояльности». */
export default function LoyaltyPage() {
  const { isLoading } = useTelegram();

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 px-4 pb-6">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold tracking-tight">
          Программа лояльности
        </h1>
      </div>

      <Card className="animate-slide-up stagger-1 flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold">Скоро!</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Программа лояльности будет доступна чуть позже
        </p>
      </Card>
    </div>
  );
}
