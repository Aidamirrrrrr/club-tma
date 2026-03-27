import { useEffect, useState } from "react";
import { fetchCommunityRequests } from "@/features/community-requests/api";
import type { CommunityRequestItem } from "@/features/community-requests/types";

interface UseCommunityRequestsParams {
  enabled: boolean;
  authHeaders: () => HeadersInit;
}

export function useCommunityRequests({
  enabled,
  authHeaders,
}: UseCommunityRequestsParams) {
  const [requests, setRequests] = useState<CommunityRequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    fetchCommunityRequests(authHeaders)
      .then(setRequests)
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [authHeaders, enabled]);

  function removeRequest(requestId: number) {
    setRequests((prev) => prev.filter((request) => request.id !== requestId));
  }

  function markReviewed(requestId: number) {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: "reviewed" } : request,
      ),
    );
  }

  return {
    requests,
    loading,
    removeRequest,
    markReviewed,
  };
}
