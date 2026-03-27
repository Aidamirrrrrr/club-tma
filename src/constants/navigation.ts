import { CalendarDays, Home, UserCircle, Users } from "lucide-react";

interface NavigationItem {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: typeof Home;
}

export const navigationItems: readonly NavigationItem[] = [
  { href: "/", label: "Главная", icon: Home },
  {
    href: "/events",
    label: "Мероприятия",
    mobileLabel: "События",
    icon: CalendarDays,
  },
  { href: "/members", label: "Участники", icon: Users },
  { href: "/profile", label: "Профиль", icon: UserCircle },
] as const;
