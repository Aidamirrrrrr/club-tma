"use client";

import { Search, Star, Users as UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";
import { EmptyState, MemberCardSkeleton } from "@/components/ui/animated";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@/db/schema";
import { useDebounce } from "@/lib/hooks";
import { getInitials } from "@/lib/utils";

export default function MembersPage() {
  const { isLoading, authHeaders } = useTelegram();
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filter, setFilter] = useState<"all" | "admins">("all");
  const [loadingData, setLoadingData] = useState(true);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filter === "admins") params.set("role", "admin");
      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) setMembers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [debouncedSearch, filter, authHeaders]);

  useEffect(() => {
    if (!isLoading) load();
  }, [load, isLoading]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 px-4 pt-32 pb-6 lg:pt-8">
      <h1 className="animate-fade-in text-xl font-bold tracking-tight">
        Участники
      </h1>

      {/* Search */}
      <div className="animate-slide-up stagger-1 relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Поиск по имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter */}
      <Tabs
        className="animate-slide-up stagger-2"
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "admins")}
      >
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="admins">Организаторы</TabsTrigger>
        </TabsList>
      </Tabs>

      {loadingData ? (
        <div className="flex flex-col gap-2">
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
        </div>
      ) : members.length === 0 ? (
        <Card className="animate-scale-in">
          <EmptyState icon={UsersIcon} message="Участники не найдены" />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((member, index) => (
            <div
              key={member.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/members/${member.id}`)}
              onKeyDown={(e) =>
                e.key === "Enter" && router.push(`/members/${member.id}`)
              }
              className={`card-interactive animate-slide-up stagger-${Math.min(index + 1, 10)} flex cursor-pointer items-center gap-3 rounded-2xl border bg-card p-3 shadow-[0_2px_8px_0_rgb(0_0_0/0.06)]`}
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
          ))}
        </div>
      )}
    </div>
  );
}
