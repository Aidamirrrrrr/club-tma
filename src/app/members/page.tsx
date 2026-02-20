"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Users as UsersIcon } from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/ui/spinner";
import { MemberCardSkeleton, EmptyState } from "@/components/ui/animated";
import type { User } from "@/db/schema";

function getInitials(firstName: string, lastName?: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

export default function MembersPage() {
  const { isLoading } = useTelegram();
  const [members, setMembers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "admins">("all");
  const [loadingData, setLoadingData] = useState(true);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch(
        `/api/users?search=${encodeURIComponent(search)}`,
      );
      if (res.ok) setMembers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5 pb-6">
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
          <TabsTrigger value="admins">Администраторы</TabsTrigger>
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
      ) : (filter === "admins"
          ? members.filter((m) => m.role === "admin")
          : members
        ).length === 0 ? (
        <Card className="animate-scale-in">
          <EmptyState icon={UsersIcon} message="Участники не найдены" />
        </Card>
      ) : (
        <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
          {(filter === "admins"
            ? members.filter((m) => m.role === "admin")
            : members
          ).map((member, index) => (
            <Link key={member.id} href={`/members/${member.id}`}>
              <Card
                className={`card-interactive animate-slide-up stagger-${Math.min(index + 1, 10)} flex items-center gap-3.5 p-3`}
              >
                <div className="relative">
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
                    <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground ring-2 ring-card">
                      ★
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold">
                    {member.firstName} {member.lastName}
                  </p>
                  {member.bio && (
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                      {member.bio}
                    </p>
                  )}
                  {(member.instagram || member.telegram) && (
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {member.instagram && (
                        <span className="flex items-center gap-0.5 rounded bg-black px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          <span>📷</span>
                          {member.instagram}
                        </span>
                      )}
                      {member.telegram && (
                        <span className="flex items-center gap-0.5 rounded bg-black px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          <span>✈️</span>
                          {member.telegram}
                        </span>
                      )}
                    </div>
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
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
