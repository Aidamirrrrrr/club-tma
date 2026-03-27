import { CalendarDays, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { EventPreview } from "@/features/events/types";
import { formatDate, statusLabels, statusVariants } from "@/lib/utils";

interface EventCardProps {
  event: EventPreview;
  href?: string;
  className?: string;
  linkClassName?: string;
}

export function EventCard({
  event,
  href = `/events/${event.id}`,
  className,
  linkClassName,
}: EventCardProps) {
  return (
    <Link href={href} className={linkClassName}>
      <Card
        className={`card-interactive flex h-full flex-col gap-2.5 overflow-hidden p-0${className ? ` ${className}` : ""}`}
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
              {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
