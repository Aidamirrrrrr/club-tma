import { Phone } from "lucide-react";
import { InstagramIcon, TelegramIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import type { ProfileData } from "@/features/profile/types";

interface ProfileContactLinksProps {
  profile: ProfileData;
}

export function ProfileContactLinks({ profile }: ProfileContactLinksProps) {
  return (
    <Card className="animate-slide-up stagger-2 flex flex-col gap-0 divide-y divide-border p-0">
      {profile.instagram && (
        <a
          href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1306C]/15">
            <InstagramIcon className="h-4.5 w-4.5 text-[#E1306C]" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Instagram</p>
            <p className="font-medium">{profile.instagram}</p>
          </div>
        </a>
      )}
      {profile.telegram && (
        <a
          href={`https://t.me/${profile.telegram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2AABEE]/15">
            <TelegramIcon className="h-4.5 w-4.5 text-[#2AABEE]" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Telegram</p>
            <p className="font-medium">{profile.telegram}</p>
          </div>
        </a>
      )}
      {profile.phone && (
        <a
          href={`tel:${profile.phone}`}
          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#34C759]/15">
            <Phone className="h-4 w-4 text-[#34C759]" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Телефон</p>
            <p className="font-medium">{profile.phone}</p>
          </div>
        </a>
      )}
      {!profile.instagram && !profile.telegram && !profile.phone && (
        <p className="px-4 py-4 text-center text-sm text-muted-foreground">
          Добавьте контактную информацию
        </p>
      )}
    </Card>
  );
}
