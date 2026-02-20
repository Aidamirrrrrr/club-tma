"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  ChevronRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AnimatedCounter,
  StatCardSkeleton,
  EventCardSkeleton,
  EmptyState,
} from "@/components/ui/animated";
import { PageLoader } from "@/components/ui/spinner";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface EventPreview {
  id: number;
  title: string;
  date: string;
  time: string;
  description: string;
  participantCount: number;
  status: string;
}

interface Stats {
  totalUsers: number;
  totalEvents: number;
  completedEvents: number;
  totalRegistrations: number;
}

export default function HomePage() {
  const { dbUser, isLoading } = useTelegram();
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [eventsRes, statsRes] = await Promise.all([
          fetch("/api/events?filter=upcoming"),
          fetch("/api/stats"),
        ]);
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents(data.slice(0, 5));
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-7 pb-6">
      {/* Hero welcome */}
      <section className="animate-fade-in">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <span className="text-lg font-bold text-primary-foreground">K</span>
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

      {/* Stats */}
      {loadingData ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </section>
      ) : stats ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="card-interactive animate-slide-up stagger-1 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary animate-icon-bounce">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="text-2xl font-bold tracking-tight animate-number-pop stagger-1">
              <AnimatedCounter value={stats.totalUsers} />
            </p>
            <p className="text-[11px] text-muted-foreground">Участников</p>
          </Card>
          <Card className="card-interactive animate-slide-up stagger-2 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary animate-icon-bounce stagger-2">
              <CalendarDays className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="text-2xl font-bold tracking-tight animate-number-pop stagger-2">
              <AnimatedCounter value={stats.totalEvents} />
            </p>
            <p className="text-[11px] text-muted-foreground">Мероприятий</p>
          </Card>
          <Card className="card-interactive animate-slide-up stagger-3 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary animate-icon-bounce stagger-3">
              <UserCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="text-2xl font-bold tracking-tight animate-number-pop stagger-3">
              <AnimatedCounter value={stats.totalRegistrations} />
            </p>
            <p className="text-[11px] text-muted-foreground">Регистраций</p>
          </Card>
          <Card className="card-interactive animate-slide-up stagger-4 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary animate-icon-bounce stagger-4">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="text-2xl font-bold tracking-tight animate-number-pop stagger-4">
              <AnimatedCounter value={stats.completedEvents} />
            </p>
            <p className="text-[11px] text-muted-foreground">Проведено</p>
          </Card>
        </section>
      ) : null}

      {/* Upcoming events */}
      <section className="animate-slide-up stagger-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Ближайшие мероприятия
          </h2>
          <Link
            href="/events"
            className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-primary/25"
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
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card
                  className={`card-interactive animate-slide-up stagger-${Math.min(index + 6, 10)} flex flex-col gap-2.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight tracking-tight">
                      {event.title}
                    </h3>
                    <Badge
                      variant={event.status === "open" ? "success" : "warning"}
                    >
                      {event.status === "open" ? "Открыто" : "Закрыто"}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3 text-primary/70" />
                      {formatDate(event.date)}
                      {event.time && `, ${event.time}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-primary/70" />
                      {event.participantCount}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick nav */}
      <section className="animate-slide-up stagger-6 grid grid-cols-2 gap-3">
        <Link href="/events">
          <Card className="card-interactive flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Мероприятия</p>
              <p className="text-[10px] text-muted-foreground">
                Все мероприятия
              </p>
            </div>
          </Card>
        </Link>
        <Link href="/members">
          <Card className="card-interactive flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Участники</p>
              <p className="text-[10px] text-muted-foreground">Все люди</p>
            </div>
          </Card>
        </Link>
      </section>
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
