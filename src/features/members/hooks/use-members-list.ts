import { useEffect, useState } from "react";
import { fetchMembers } from "@/features/members/api";
import type { MemberListItemData } from "@/features/members/types";

interface UseMembersListParams {
  search: string;
  filter: "all" | "admins" | "blocked";
  enabled: boolean;
  authHeaders: () => HeadersInit;
}

export function useMembersList({
  search,
  filter,
  enabled,
  authHeaders,
}: UseMembersListParams) {
  const [members, setMembers] = useState<MemberListItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter === "admins") params.set("role", "admin");
    if (filter === "blocked") params.set("blocked", "true");

    fetchMembers(params, authHeaders, controller.signal)
      .then(setMembers)
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [authHeaders, enabled, filter, search]);

  return { members, loading };
}
