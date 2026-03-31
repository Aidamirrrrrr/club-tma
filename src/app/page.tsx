"use client";

import {
  CalendarDays,
  ChevronRight,
  Gift,
  MessageSquarePlus,
  MessagesSquare,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, EventCardSkeleton } from "@/components/ui/animated";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { EventCard, type EventPreview } from "@/features/events";
import { useTelegram } from "@/integrations/telegram";

/** Главная страница: приветствие, статистика, ближайшие мероприятия. */
export default function HomePage() {
  const { dbUser, isLoading, authHeaders } = useTelegram();
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!dbUser) {
      setLoadingData(false);
      return;
    }
    async function load() {
      try {
        const headers = authHeaders();
        const eventsRes = await fetch("/api/events?filter=upcoming", {
          headers,
        });
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents(data.slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [isLoading, dbUser, authHeaders]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-7 px-4 pb-6">
      <section className="animate-fade-in rounded-2xl bg-muted/50 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-sm lg:hidden">
            <Image src="/logo.png" alt="Клуб" width={26} height={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Привет{dbUser ? `, ${dbUser.firstName}` : ""}!
            </h1>
            <p className="text-xs text-muted-foreground">
              Добро пожаловать в клуб
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Сообщество единомышленников — участвуй в мероприятиях, знакомься с
          участниками и будь в курсе событий клуба.
        </p>
      </section>

      <section className="animate-slide-up stagger-5 grid grid-cols-2 gap-3">
        <Link href="/events" className="flex">
          <Card className="card-interactive flex w-full flex-col overflow-hidden p-0">
            <div className="relative h-32 bg-primary/5">
              <Image
                src="/events.png"
                alt="Мероприятия"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2.5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <CalendarDays className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  Мероприятия
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Все мероприятия
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/community-request" className="flex">
          <Card className="card-interactive flex w-full flex-col overflow-hidden p-0">
            <div className="relative h-32 bg-primary/5">
              <Image
                src="/request.png"
                alt="Запрос в сообщество"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2.5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <MessageSquarePlus className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Запрос</p>
                <p className="text-[10px] text-muted-foreground">
                  В сообщество
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/members" className="flex">
          <Card className="card-interactive flex w-full flex-col overflow-hidden p-0">
            <div className="relative h-32 bg-primary/5">
              <Image
                src="/members.png"
                alt="Участники"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2.5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Участники</p>
                <p className="text-[10px] text-muted-foreground">Все люди</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/chats" className="flex">
          <Card className="card-interactive flex w-full flex-col overflow-hidden p-0">
            <div className="relative h-32 bg-primary/5">
              <Image
                src="/chats.png"
                alt="Чаты и каналы"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2.5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <MessagesSquare className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  Чаты и каналы
                </p>
                <p className="text-[10px] text-muted-foreground">Ссылки</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/loyalty" className="col-span-2 flex">
          <Card className="card-interactive flex w-full items-center overflow-hidden p-0">
            <div className="relative h-24 w-24 shrink-0 bg-primary/5">
              <Image
                src="/decor-4.png"
                alt="Программа лояльности"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2.5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Gift className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  Программа лояльности
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Бонусы и привилегии
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </section>

      <section className="animate-slide-up stagger-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Ближайшие мероприятия
          </h2>
          <Link
            href="/events"
            className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-black transition-colors hover:bg-primary/90"
          >
            Все <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingData ? (
          <div className="flex flex-col gap-3">
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : events.length === 0 ? (
          <Card className="animate-scale-in">
            <EmptyState
              icon={CalendarDays}
              message="Пока нет предстоящих мероприятий"
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                linkClassName="flex"
                className={`animate-slide-up stagger-${Math.min(index + 6, 10)}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
