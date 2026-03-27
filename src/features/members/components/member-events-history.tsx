import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { MemberEvent } from "@/features/members/types";
import { formatDate } from "@/lib/utils";

interface MemberEventsHistoryProps {
  events: MemberEvent[];
}

export function MemberEventsHistory({ events }: MemberEventsHistoryProps) {
  return (
    <section className="animate-slide-up stagger-4">
      <h2 className="mb-3 text-base font-semibold tracking-tight">
        История мероприятий ({events.length})
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Пока не участвовал(а) в мероприятиях
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event, index) => (
            <Link key={event.eventId} href={`/events/${event.eventId}`}>
              <Card
                className="card-interactive animate-slide-in-right flex items-center gap-3 p-3"
                style={{ animationDelay: `${0.05 * (index + 1)}s` }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <CalendarDays className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{event.eventTitle}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(event.eventDate)}
                    {event.eventTime && `, ${event.eventTime}`}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
