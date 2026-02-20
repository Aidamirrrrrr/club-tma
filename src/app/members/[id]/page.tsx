"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Phone,
  CalendarDays,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  Star,
} from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

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
  events: MemberEvent[];
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"
        fill="currentColor"
      />
      <path
        d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8z"
        fill="currentColor"
      />
      <circle cx="18.406" cy="5.594" r="1.44" fill="currentColor" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, isLoading: authLoading, authHeaders } = useTelegram();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMember = async () => {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (res.ok) setMember(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMember();
  }, [id]);

  const toggleRole = async () => {
    if (!member) return;
    const newRole = member.role === "admin" ? "user" : "admin";
    const res = await fetch(`/api/users/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) loadMember();
  };

  const toggleBlock = async () => {
    if (!member) return;
    const res = await fetch(`/api/users/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ blocked: !member.blocked }),
    });
    if (res.ok) loadMember();
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
      {/* Profile header */}
      <div className="animate-fade-in -mx-4 -mt-2 overflow-hidden rounded-b-3xl bg-linear-to-b from-primary/10 to-transparent px-4 pb-6 pt-4 lg:rounded-3xl lg:mx-0 lg:mt-0">
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
              <span className="absolute -right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-3 ring-card shadow-md">
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
            <div className="mt-2 flex items-center justify-center gap-2">
              {member.role === "admin" && (
                <Badge variant="success">Организатор</Badge>
              )}
              {member.blocked && <Badge variant="danger">Заблокирован</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Contacts + Admin + Events: two-column on desktop */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          {/* Contacts */}
          {(member.instagram || member.telegram || member.phone) && (
            <Card className="animate-slide-up stagger-2 flex flex-col gap-0 divide-y divide-border p-0">
              {member.instagram && (
                <a
                  href={`https://instagram.com/${member.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-purple-500/15 to-pink-500/15">
                    <InstagramIcon className="h-4.5 w-4.5 text-pink-600" />
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                    <TelegramIcon className="h-4.5 w-4.5 text-sky-500" />
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Phone className="h-4 w-4 text-emerald-600" />
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

          {/* Admin controls */}
          {isAdmin && (
            <div className="animate-slide-up stagger-3 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={toggleRole}
              >
                {member.role === "admin" ? (
                  <>
                    <ShieldOff className="h-4 w-4" /> Снять админа
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" /> Сделать админом
                  </>
                )}
              </Button>
              <Button
                variant={member.blocked ? "default" : "destructive"}
                onClick={toggleBlock}
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
            </div>
          )}
        </div>

        {/* Event history */}
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
  );
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMM yyyy", { locale: ru });
  } catch {
    return dateStr;
  }
}
