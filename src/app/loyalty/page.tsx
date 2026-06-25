"use client";

import { Gift, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/ui/animated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  deleteLoyaltyOffer,
  LoyaltyCard,
  type LoyaltyOffer,
  useLoyaltyList,
} from "@/features/loyalty";
import { useTelegram } from "@/integrations/telegram";

/** Страница «Программа лояльности» — карточки скидок партнёров. */
export default function LoyaltyPage() {
  const { isAdmin, isLoading, authHeaders } = useTelegram();
  const { success, error: showError } = useToast();
  const { offers, loading, reload } = useLoyaltyList({
    enabled: !isLoading,
    authHeaders,
  });
  const [toDelete, setToDelete] = useState<LoyaltyOffer | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const response = await deleteLoyaltyOffer(toDelete.id, authHeaders);
      if (response.ok) {
        success("Карточка удалена");
        reload();
      } else {
        showError("Не удалось удалить");
      }
    } catch (error) {
      console.error(error);
      showError("Ошибка сети");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 px-4 pb-6">
      <div className="animate-fade-in flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          Программа лояльности
        </h1>
        {isAdmin && (
          <Link href="/loyalty/create">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Создать
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : offers.length === 0 ? (
        <Card className="animate-scale-in">
          <EmptyState icon={Gift} message="Пока нет доступных скидок" />
        </Card>
      ) : (
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
          {offers.map((offer, index) => (
            <LoyaltyCard
              key={offer.id}
              offer={offer}
              isAdmin={isAdmin}
              onDelete={setToDelete}
              className={`animate-slide-up stagger-${Math.min(index + 1, 10)}`}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить карточку?"
        description={
          toDelete
            ? `«${toDelete.title}» будет удалена без возможности восстановления.`
            : undefined
        }
        confirmLabel={deleting ? "Удаление..." : "Удалить"}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
