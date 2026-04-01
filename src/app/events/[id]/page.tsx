"use client";

import { Copy, Edit, Share2, Trash2, UserCheck, UserX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  EventDetailsSummary,
  EventParticipantsList,
  useEventDetail,
} from "@/features/events";
import { useTelegram } from "@/integrations/telegram";
import { statusLabels, statusVariants } from "@/lib/utils";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const {
    dbUser,
    isAdmin,
    isLoading: authLoading,
    authHeaders,
  } = useTelegram();
  const {
    event,
    loading,
    actionLoading,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isRegistered,
    handleRegister,
    handleUnregister,
    handleDelete,
    handleShare,
  } = useEventDetail({
    eventId: id,
    userId: dbUser?.id,
    enabled: !authLoading && !!dbUser,
    authHeaders,
    toast,
  });

  if (authLoading || loading) return <PageLoader />;
  if (!event)
    return (
      <div className="animate-fade-in py-20 text-center text-muted-foreground">
        Мероприятие не найдено
      </div>
    );

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="animate-scale-in">
        {event.coverUrl ? (
          <Image
            src={event.coverUrl}
            alt={event.title}
            width={800}
            height={400}
            className="h-72 w-full rounded-b-3xl object-cover shadow-[0_2px_8px_0_rgb(0_0_0/0.06),0_1px_3px_-1px_rgb(0_0_0/0.04)]"
            unoptimized
          />
        ) : (
          <div className="h-48 w-full rounded-b-3xl bg-linear-to-br from-primary/80 via-primary/40 to-background shadow-[0_2px_8px_0_rgb(0_0_0/0.06),0_1px_3px_-1px_rgb(0_0_0/0.04)]" />
        )}
      </div>

      <div className="flex flex-col gap-5 px-4">
        <div className="animate-fade-in flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            {event.title}
          </h1>
          <Badge variant={statusVariants[event.status]}>
            {statusLabels[event.status]}
          </Badge>
        </div>

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-5">
            <EventDetailsSummary event={event} />

            <div className="animate-slide-up stagger-3 flex gap-2">
              {event.status === "open" &&
                event.date >= new Date().toISOString().slice(0, 10) &&
                dbUser &&
                (isRegistered ? (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={handleUnregister}
                    disabled={actionLoading}
                  >
                    <UserX className="h-4 w-4" />
                    Отменить регистрацию
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={handleRegister}
                    disabled={actionLoading}
                  >
                    <UserCheck className="h-4 w-4" />
                    Зарегистрироваться
                  </Button>
                ))}
              <Button variant="ghost" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {isAdmin && (
              <div className="animate-slide-up stagger-4 flex gap-2">
                <Link href={`/events/${event.id}/edit`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    <Edit className="h-4 w-4" />
                    Редактировать
                  </Button>
                </Link>
                <Link href={`/events/create?from=${event.id}`}>
                  <Button variant="secondary">
                    <Copy className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <EventParticipantsList event={event} />
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Удалить мероприятие?"
        description="Это действие нельзя отменить. Все регистрации будут удалены."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
