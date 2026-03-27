"use client";

import { Search, Users as UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, MemberCardSkeleton } from "@/components/ui/animated";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberListItem, useMembersList } from "@/features/members";
import { useDebounce } from "@/hooks/use-debounce";
import { useTelegram } from "@/integrations/telegram";

/** Страница списка участников клуба. */
export default function MembersPage() {
  const { isLoading, isAdmin, authHeaders } = useTelegram();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filter, setFilter] = useState<"all" | "admins" | "blocked">("all");
  const { members, loading } = useMembersList({
    search: debouncedSearch,
    filter,
    enabled: !isLoading,
    authHeaders,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 px-4 pb-6">
      <h1 className="animate-fade-in text-xl font-bold tracking-tight">
        Участники
      </h1>

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

      <Tabs
        className="animate-slide-up stagger-2"
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "admins" | "blocked")}
      >
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="admins">Организаторы</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="blocked">Заблокированные</TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {loading ? (
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
            <MemberListItem
              key={member.id}
              member={member}
              onClick={() => router.push(`/members/${member.id}`)}
              onKeyDown={(e) =>
                e.key === "Enter" && router.push(`/members/${member.id}`)
              }
              className={`animate-slide-up stagger-${Math.min(index + 1, 10)}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
