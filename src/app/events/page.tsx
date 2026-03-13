"use client";

import { CalendarDays, MapPin, Plus, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram";
import { EmptyState, EventCardSkeleton } from "@/components/ui/animated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/lib/hooks";
import { formatDate, statusLabels, statusVariants } from "@/lib/utils";

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

/** Страница списка мероприятий с поиском и фильтрами. */
export default function EventsPage() {
  const { isAdmin, isLoading, tgUser, authHeaders } = useTelegram();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past" | "mine">(
    "upcoming",
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const params = new URLSearchParams({ filter, search: debouncedSearch });
      if (filter === "mine" && tgUser?.id) {
        params.set("telegramId", String(tgUser.id));
      }
      const res = await fetch(`/api/events?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [filter, debouncedSearch, tgUser, authHeaders]);

  useEffect(() => {
    if (!isLoading) load();
  }, [load, isLoading]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
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

      <Tabs
        className="animate-slide-up stagger-2"
        value={filter}
        onValueChange={(v) => setFilter(v as "upcoming" | "past" | "mine")}
      >
        <TabsList>
          <TabsTrigger value="upcoming">Предстоящие</TabsTrigger>
          <TabsTrigger value="past">Прошедшие</TabsTrigger>
          <TabsTrigger value="mine">Мои</TabsTrigger>
        </TabsList>
      </Tabs>

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
              filter === "mine"
                ? "Вы не участвуете ни в одном мероприятии"
                : filter === "upcoming"
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
                className={`card-interactive animate-slide-up stagger-${Math.min(index + 1, 10)} flex h-full flex-col gap-2.5 overflow-hidden p-0`}
              >
                {event.coverUrl && (
                  <Image
                    src={event.coverUrl}
                    alt={event.title}
                    width={800}
                    height={400}
                    className="h-48 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-2">
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
                  <div className="mt-auto flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <CalendarDays className="h-3 w-3 text-primary-foreground" />
                      </span>
                      {formatDate(event.date)}
                      {event.time && `, ${event.time}`}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <MapPin className="h-3 w-3 text-primary-foreground" />
                        </span>
                        {event.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Users className="h-3 w-3 text-primary-foreground" />
                      </span>
                      {event.participantCount}
                      {event.maxParticipants
                        ? ` / ${event.maxParticipants}`
                        : ""}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
