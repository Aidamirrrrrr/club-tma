import { CalendarDays, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { EventDetail } from "@/features/events/types";
import { formatDate } from "@/lib/utils";

interface EventDetailsSummaryProps {
  event: EventDetail;
}

export function EventDetailsSummary({ event }: EventDetailsSummaryProps) {
  return (
    <>
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
            {event.maxParticipants ? ` / ${event.maxParticipants} мест` : ""}
          </span>
        </span>
      </Card>

      {event.description && (
        <Card className="animate-slide-up stagger-2">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        </Card>
      )}
    </>
  );
}
