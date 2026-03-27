"use client";

import { CalendarDays, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, EventCardSkeleton } from "@/components/ui/animated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard, useEventsList } from "@/features/events";
import { useDebounce } from "@/hooks/use-debounce";
import { useTelegram } from "@/integrations/telegram";

/** Страница списка мероприятий с поиском и фильтрами. */
export default function EventsPage() {
  const { isAdmin, isLoading, tgUser, authHeaders } = useTelegram();
  const [filter, setFilter] = useState<"upcoming" | "past" | "mine">(
    "upcoming",
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { events, loading } = useEventsList({
    filter,
    search: debouncedSearch,
    telegramUserId: tgUser?.id,
    enabled: !isLoading,
    authHeaders,
  });

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

      {loading ? (
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
            <EventCard
              key={event.id}
              event={event}
              className={`animate-slide-up stagger-${Math.min(index + 1, 10)}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
