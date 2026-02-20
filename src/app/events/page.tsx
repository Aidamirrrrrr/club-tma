"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, Users, MapPin, Search, Plus } from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/ui/spinner";
import { EventCardSkeleton, EmptyState } from "@/components/ui/animated";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  coverUrl: string | null;
  maxParticipants: number | null;
  status: string;
  participantCount: number;
}

const statusLabels: Record<string, string> = {
  open: "Открыта регистрация",
  closed: "Закрыта",
  cancelled: "Отменено",
  completed: "Завершено",
};

const statusVariants: Record<
  string,
  "success" | "warning" | "danger" | "default"
> = {
  open: "success",
  closed: "warning",
  cancelled: "danger",
  completed: "default",
};

export default function EventsPage() {
  const { isAdmin, isLoading } = useTelegram();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch(
        `/api/events?filter=${filter}&search=${encodeURIComponent(search)}`,
      );
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="animate-fade-in flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Мероприятия</h1>
        {isAdmin && (
          <Link href="/events/create">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Создать
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="animate-slide-up stagger-1 relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter tabs */}
      <Tabs
        className="animate-slide-up stagger-2"
        value={filter}
        onValueChange={(v) => setFilter(v as "upcoming" | "past")}
      >
        <TabsList>
          <TabsTrigger value="upcoming">Предстоящие</TabsTrigger>
          <TabsTrigger value="past">Прошедшие</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Events list */}
      {loadingData ? (
        <div className="flex flex-col gap-3">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : events.length === 0 ? (
        <Card className="animate-scale-in">
          <EmptyState
            icon={CalendarDays}
            message={
              filter === "upcoming"
                ? "Нет предстоящих мероприятий"
                : "Нет прошедших мероприятий"
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
          {events.map((event, index) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card
                className={`card-interactive animate-slide-up stagger-${Math.min(index + 1, 10)} flex flex-col gap-2.5`}
              >
                {event.coverUrl && (
                  <img
                    src={event.coverUrl}
                    alt={event.title}
                    className="-mx-4 -mt-4 h-40 w-[calc(100%+2rem)] rounded-t-2xl object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight tracking-tight">
                    {event.title}
                  </h3>
                  <Badge variant={statusVariants[event.status]}>
                    {statusLabels[event.status] || event.status}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3 text-primary/70" />
                    {formatDate(event.date)}
                    {event.time && `, ${event.time}`}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-primary/70" />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-primary/70" />
                    {event.participantCount}
                    {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
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
