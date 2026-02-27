"use client";

import {
  CalendarDays,
  Edit,
  MapPin,
  Share2,
  Star,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  formatDate,
  getInitials,
  statusLabels,
  statusVariants,
} from "@/lib/utils";

interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  photoUrl: string;
}

interface EventDetail {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  coverUrl: string | null;
  maxParticipants: number | null;
  status: string;
  createdBy: number | null;
  participants: Participant[];
  participantCount: number;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const {
    dbUser,
    isAdmin,
    isLoading: authLoading,
    authHeaders,
  } = useTelegram();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isRegistered = event?.participants?.some((p) => p.id === dbUser?.id);

  const loadEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}`, { headers: authHeaders() });
      if (res.ok) setEvent(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, authHeaders]);

  useEffect(() => {
    if (!authLoading && dbUser) loadEvent();
  }, [loadEvent, authLoading, dbUser]);

  const handleRegister = async () => {
    if (!dbUser || !event) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      if (res.ok) {
        toast("Вы зарегистрированы!", "success");
        await loadEvent();
      } else {
        const data = await res.json();
        toast(data.error || "Ошибка регистрации", "error");
      }
    } catch (e) {
      console.error(e);
      toast("Ошибка сети", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!dbUser || !event) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        toast("Регистрация отменена", "info");
        await loadEvent();
      } else {
        const data = await res.json();
        toast(data.error || "Ошибка", "error");
      }
    } catch (e) {
      console.error(e);
      toast("Ошибка сети", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        toast("Мероприятие удалено", "success");
        router.push("/events");
      } else {
        toast("Ошибка удаления", "error");
      }
    } catch (e) {
      console.error(e);
      toast("Ошибка сети", "error");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = () => {
    if (!event) return;
    const text = `${event.title}\n${formatDate(event.date)}${event.time ? `, ${event.time}` : ""}\n${event.location || ""}`;
    if (navigator.share) {
      navigator.share({ title: event.title, text });
    }
  };

  if (authLoading || loading) return <PageLoader />;
  if (!event)
    return (
      <div className="animate-fade-in py-20 text-center text-muted-foreground">
        Мероприятие не найдено
      </div>
    );

  return (
    <div className="flex flex-col gap-5 pb-6">
      {event.coverUrl && (
        <div className="animate-scale-in -mx-4 -mt-28 overflow-hidden lg:-mt-8">
          <Image
            src={event.coverUrl}
            alt={event.title}
            width={800}
            height={400}
            className="h-72 w-full rounded-b-3xl object-cover shadow-[0_2px_8px_0_rgb(0_0_0/0.06),0_1px_3px_-1px_rgb(0_0_0/0.04)]"
          />
        </div>
      )}

      <div className="animate-fade-in flex items-start justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
          {event.title}
        </h1>
        <Badge variant={statusVariants[event.status]}>
          {statusLabels[event.status]}
        </Badge>
      </div>

      {/* Content: two-column on desktop */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          {/* Info */}
          <Card className="animate-slide-up stagger-1 flex flex-col gap-3">
            <span className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <CalendarDays className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-muted-foreground">
                {formatDate(event.date, "d MMMM yyyy")}
                {event.time && `, ${event.time}`}
              </span>
            </span>
            {event.location && (
              <span className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <MapPin className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-muted-foreground">{event.location}</span>
              </span>
            )}
            <span className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-muted-foreground">
                {event.participantCount} участник(ов)
                {event.maxParticipants
                  ? ` / ${event.maxParticipants} мест`
                  : ""}
              </span>
            </span>
          </Card>

          {/* Description */}
          {event.description && (
            <Card className="animate-slide-up stagger-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {event.description}
              </p>
            </Card>
          )}

          {/* Actions */}
          <div className="animate-slide-up stagger-3 flex gap-2">
            {event.status === "open" &&
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

          {/* Admin actions */}
          {isAdmin && (
            <div className="animate-slide-up stagger-4 flex gap-2">
              <Link href={`/events/${event.id}/edit`} className="flex-1">
                <Button variant="secondary" className="w-full">
                  <Edit className="h-4 w-4" />
                  Редактировать
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

        {/* Participants */}
        <section className="animate-slide-up stagger-5">
          <h2 className="mb-3 text-base font-semibold tracking-tight">
            Участники ({event.participantCount})
          </h2>
          {event.participants.length === 0 ? (
            <p className="animate-fade-in text-sm text-muted-foreground">
              Пока никто не зарегистрировался
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {event.participants.map((p, index) => {
                const isOrganizer = p.id === event.createdBy;
                return (
                  <Link key={p.id} href={`/members/${p.id}`}>
                    <Card
                      className={`card-interactive animate-slide-in-right flex items-center gap-3 p-3${isOrganizer ? " ring-1 ring-primary/30" : ""}`}
                      style={{ animationDelay: `${0.05 * (index + 1)}s` }}
                    >
                      <div className="relative">
                        <Avatar size="sm">
                          {p.photoUrl && (
                            <AvatarImage
                              src={p.photoUrl}
                              alt={`${p.firstName} ${p.lastName}`}
                            />
                          )}
                          <AvatarFallback>
                            {getInitials(p.firstName, p.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        {isOrganizer && (
                          <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
                            <Star className="h-2.5 w-2.5 fill-current" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {p.firstName} {p.lastName}
                          </p>
                          {isOrganizer && (
                            <Badge
                              variant="success"
                              className="text-[10px] px-1.5 py-0"
                            >
                              Организатор
                            </Badge>
                          )}
                        </div>
                        {p.username && (
                          <p className="text-[11px] text-muted-foreground">
                            @{p.username}
                          </p>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
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
