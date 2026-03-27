import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ProfileEvent } from "@/features/profile/types";
import { formatDate } from "@/lib/utils";

interface ProfileEventsSectionProps {
  title: string;
  events: ProfileEvent[];
  emptyMessage: string;
  faded?: boolean;
}

export function ProfileEventsSection({
  title,
  events,
  emptyMessage,
  faded = false,
}: ProfileEventsSectionProps) {
  return (
    <section className="animate-slide-up stagger-3">
      <h2 className="mb-3 text-base font-semibold tracking-tight">
        {title} ({events.length})
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <Link key={event.eventId} href={`/events/${event.eventId}`}>
              <Card
                className={`card-interactive flex items-center gap-3 p-3${faded ? " opacity-60" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${faded ? "bg-muted" : "bg-primary"}`}
                >
                  <CalendarDays
                    className={`h-4 w-4 ${faded ? "" : "text-primary-foreground"}`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{event.eventTitle}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(event.eventDate)}
                    {!faded && event.eventTime && `, ${event.eventTime}`}
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
