"use client";

import {
  Ban,
  CalendarDays,
  CheckCircle,
  Phone,
  Shield,
  ShieldOff,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { InstagramIcon, TelegramIcon } from "@/components/icons";
import { useTelegram } from "@/components/telegram";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  defaultGradient,
  formatDate,
  getInitials,
  isImageUrl,
} from "@/lib/utils";

interface MemberEvent {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventStatus: string;
}

interface MemberDetail {
  id: number;
  telegramId: string;
  firstName: string;
  lastName: string;
  username: string;
  photoUrl: string;
  bio: string;
  instagram: string;
  telegram: string;
  phone: string;
  role: string;
  blocked: boolean;
  profileGradient: string;
  events: MemberEvent[];
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, isLoading: authLoading, authHeaders } = useTelegram();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  const loadMember = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${id}`, { headers: authHeaders() });
      if (res.ok) setMember(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, authHeaders]);

  useEffect(() => {
    if (!authLoading) loadMember();
  }, [loadMember, authLoading]);

  const toggleRole = async () => {
    if (!member || actionLoading) return;
    const newRole = member.role === "admin" ? "user" : "admin";
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(
          newRole === "admin"
            ? "Назначен организатором"
            : "Роль организатора снята",
        );
        await loadMember();
      } else {
        toast.error("Не удалось изменить роль");
      }
    } catch {
      toast.error("Не удалось изменить роль");
    } finally {
      setActionLoading(false);
      setShowRoleConfirm(false);
    }
  };

  const toggleBlock = async () => {
    if (!member || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ blocked: !member.blocked }),
      });
      if (res.ok) {
        toast.success(
          member.blocked
            ? "Пользователь разблокирован"
            : "Пользователь заблокирован",
        );
        await loadMember();
      } else {
        toast.error("Не удалось выполнить действие");
      }
    } catch {
      toast.error("Не удалось выполнить действие");
    } finally {
      setActionLoading(false);
      setShowBlockConfirm(false);
    }
  };

  if (authLoading || loading) return <PageLoader />;
  if (!member)
    return (
      <div className="animate-fade-in py-20 text-center text-muted-foreground">
        Пользователь не найден
      </div>
    );

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div
        className="animate-fade-in overflow-clip rounded-b-3xl px-4 pb-6 transition-all duration-500 lg:rounded-3xl"
        style={
          isImageUrl(member.profileGradient)
            ? {
                backgroundImage: `linear-gradient(to bottom, transparent 40%, var(--background)), url(${member.profileGradient})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                paddingTop:
                  "max(calc(var(--tg-viewport-safe-area-inset-top, 0px) + var(--tg-viewport-content-safe-area-inset-top, 0px) + 32px), 24px)",
              }
            : {
                background: defaultGradient,
                paddingTop:
                  "max(calc(var(--tg-viewport-safe-area-inset-top, 0px) + var(--tg-viewport-content-safe-area-inset-top, 0px) + 32px), 24px)",
              }
        }
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="animate-bounce-in relative">
            <Avatar size="lg" className="size-24! ring-4 ring-card shadow-lg">
              {member.photoUrl && (
                <AvatarImage
                  src={member.photoUrl}
                  alt={`${member.firstName} ${member.lastName}`}
                />
              )}
              <AvatarFallback className="text-lg">
                {getInitials(member.firstName, member.lastName)}
              </AvatarFallback>
            </Avatar>
            {member.role === "admin" && (
              <span
                key={`star-${member.role}`}
                className="absolute -right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-3 ring-card shadow-md animate-bounce-in"
              >
                <Star className="h-3.5 w-3.5 fill-current" />
              </span>
            )}
          </div>
          <div className="animate-slide-up stagger-1">
            <h1 className="text-xl font-bold tracking-tight">
              {member.firstName} {member.lastName}
            </h1>
            {member.bio && (
              <p className="mx-auto mt-1.5 max-w-70 text-sm leading-relaxed text-muted-foreground">
                {member.bio}
              </p>
            )}
            <div className="mt-2 flex min-h-6 items-center justify-center gap-2">
              {member.role === "admin" && (
                <Badge
                  key={`badge-${member.role}`}
                  variant="success"
                  className="animate-bounce-in"
                >
                  Организатор
                </Badge>
              )}
              {member.blocked && (
                <Badge variant="danger" className="animate-bounce-in">
                  Заблокирован
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4">
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-5">
            {(member.instagram || member.telegram || member.phone) && (
              <Card className="animate-slide-up stagger-2 flex flex-col gap-0 divide-y divide-border p-0">
                {member.instagram && (
                  <a
                    href={`https://instagram.com/${member.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1306C]/15">
                      <InstagramIcon className="h-4.5 w-4.5 text-[#E1306C]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Instagram</p>
                      <p className="font-medium">{member.instagram}</p>
                    </div>
                  </a>
                )}
                {member.telegram && (
                  <a
                    href={`https://t.me/${member.telegram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2AABEE]/15">
                      <TelegramIcon className="h-4.5 w-4.5 text-[#2AABEE]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Telegram</p>
                      <p className="font-medium">{member.telegram}</p>
                    </div>
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#34C759]/15">
                      <Phone className="h-4 w-4 text-[#34C759]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Телефон</p>
                      <p className="font-medium">{member.phone}</p>
                    </div>
                  </a>
                )}
              </Card>
            )}
            {!member.instagram && !member.telegram && !member.phone && (
              <Card className="animate-slide-up stagger-2">
                <p className="text-center text-sm text-muted-foreground">
                  Нет контактной информации
                </p>
              </Card>
            )}

            {isAdmin && (
              <div className="animate-slide-up stagger-3 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowRoleConfirm(true)}
                  disabled={actionLoading}
                >
                  {member.role === "admin" ? (
                    <>
                      <ShieldOff className="h-4 w-4" /> Снять организатора
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" /> Сделать организатором
                    </>
                  )}
                </Button>
                <Button
                  variant={member.blocked ? "default" : "destructive"}
                  className="w-full"
                  onClick={() => setShowBlockConfirm(true)}
                  disabled={actionLoading}
                >
                  {member.blocked ? (
                    <>
                      <CheckCircle className="h-4 w-4" /> Разблокировать
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" /> Заблокировать
                    </>
                  )}
                </Button>
                <ConfirmDialog
                  open={showRoleConfirm}
                  title={
                    member.role === "admin"
                      ? "Снять организатора"
                      : "Назначить организатором"
                  }
                  description={
                    member.role === "admin"
                      ? `Снять роль организатора у ${member.firstName}?`
                      : `Назначить ${member.firstName} организатором?`
                  }
                  confirmLabel="Подтвердить"
                  onConfirm={toggleRole}
                  onCancel={() => setShowRoleConfirm(false)}
                />
                <ConfirmDialog
                  open={showBlockConfirm}
                  title={member.blocked ? "Разблокировать" : "Заблокировать"}
                  description={
                    member.blocked
                      ? `Разблокировать ${member.firstName}?`
                      : `Заблокировать ${member.firstName}? Пользователь потеряет доступ.`
                  }
                  confirmLabel={
                    member.blocked ? "Разблокировать" : "Заблокировать"
                  }
                  variant={member.blocked ? "default" : "destructive"}
                  onConfirm={toggleBlock}
                  onCancel={() => setShowBlockConfirm(false)}
                />
              </div>
            )}
          </div>

          <section className="animate-slide-up stagger-4">
            <h2 className="mb-3 text-base font-semibold tracking-tight">
              История мероприятий ({member.events?.length || 0})
            </h2>
            {!member.events || member.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Пока не участвовал(а) в мероприятиях
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {member.events.map((ev, index) => (
                  <Link key={ev.eventId} href={`/events/${ev.eventId}`}>
                    <Card
                      className="card-interactive animate-slide-in-right flex items-center gap-3 p-3"
                      style={{ animationDelay: `${0.05 * (index + 1)}s` }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <CalendarDays className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ev.eventTitle}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(ev.eventDate)}
                          {ev.eventTime && `, ${ev.eventTime}`}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
