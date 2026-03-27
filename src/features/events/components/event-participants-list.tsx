import { Star } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { EventDetail } from "@/features/events/types";
import { getInitials } from "@/lib/utils";

interface EventParticipantsListProps {
  event: EventDetail;
}

export function EventParticipantsList({ event }: EventParticipantsListProps) {
  return (
    <section className="animate-slide-up stagger-5">
      <h2 className="mb-3 text-base font-semibold tracking-tight">
        Участники ({event.participantCount})
      </h2>
      {event.participants.length === 0 ? (
        <p className="animate-fade-in text-sm text-muted-foreground">
          Пока никто не зарегистрировался
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {event.participants.map((participant, index) => {
            const isOrganizer = participant.id === event.createdBy;
            return (
              <Link key={participant.id} href={`/members/${participant.id}`}>
                <Card
                  className={`card-interactive animate-slide-in-right flex items-center gap-3 p-3${isOrganizer ? " ring-1 ring-primary/30" : ""}`}
                  style={{ animationDelay: `${0.05 * (index + 1)}s` }}
                >
                  <div className="relative">
                    <Avatar size="sm">
                      {participant.photoUrl && (
                        <AvatarImage
                          src={participant.photoUrl}
                          alt={`${participant.firstName} ${participant.lastName}`}
                        />
                      )}
                      <AvatarFallback>
                        {getInitials(
                          participant.firstName,
                          participant.lastName,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {isOrganizer && (
                      <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
                        <Star className="h-2.5 w-2.5 fill-current" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {participant.firstName} {participant.lastName}
                      </p>
                      {isOrganizer && (
                        <Badge
                          variant="success"
                          className="px-1.5 py-0 text-[10px]"
                        >
                          Организатор
                        </Badge>
                      )}
                    </div>
                    {participant.username && (
                      <p className="text-[11px] text-muted-foreground">
                        @{participant.username}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
