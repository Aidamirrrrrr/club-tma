"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Users as UsersIcon, Star } from "lucide-react";
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
    <div className="flex flex-col gap-5 overflow-x-hidden pb-6">
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
                className={`card-interactive animate-slide-up stagger-${Math.min(index + 1, 10)} flex h-18 items-center gap-3.5 p-3`}
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
                    <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
                      <Star className="h-2.5 w-2.5 fill-current" />
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
                    <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden text-[11px] text-muted-foreground">
                      {member.instagram && (
                        <span className="flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-black">
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z" />
                            <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8z" />
                            <circle cx="18.406" cy="5.594" r="1.44" />
                          </svg>
                          {member.instagram}
                        </span>
                      )}
                      {member.telegram && (
                        <span className="flex items-center gap-1 rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                          </svg>
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
