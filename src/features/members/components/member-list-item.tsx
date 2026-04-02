import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { MemberListItemData } from "@/features/members/types";
import { getInitials } from "@/lib/utils";

interface MemberListItemProps {
  member: MemberListItemData;
  className?: string;
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

export function MemberListItem({
  member,
  className,
  onClick,
  onKeyDown,
}: MemberListItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`card-interactive flex cursor-pointer items-center gap-3 rounded-2xl border bg-card p-3 shadow-[0_2px_8px_0_rgb(0_0_0/0.08),inset_0_1px_0_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)]${className ? ` ${className}` : ""}`}
    >
      <div className="relative shrink-0">
        <Avatar>
          {member.photoUrl && (
            <AvatarImage
              src={member.photoUrl}
              alt={`${member.firstName} ${member.lastName}`}
            />
          )}
          <AvatarFallback>
            {getInitials(member.firstName, member.lastName || "")}
          </AvatarFallback>
        </Avatar>
        {member.role === "admin" && (
          <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
            <Star className="h-2.5 w-2.5 fill-current" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-sm font-semibold">
          {member.firstName} {member.lastName}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {member.bio ||
            [
              member.telegram &&
                (member.telegram.startsWith("@")
                  ? member.telegram
                  : `@${member.telegram}`),
              member.instagram && member.instagram,
            ]
              .filter(Boolean)
              .join(" · ") ||
            "Участник"}
        </p>
        {member.isTeam && (
          <Badge variant="default" className="mt-1 text-[10px] py-0 px-1.5 h-4">
            D1 Команда
          </Badge>
        )}
      </div>
      <svg
        className="h-4 w-4 shrink-0 text-muted-foreground/40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </div>
  );
}
