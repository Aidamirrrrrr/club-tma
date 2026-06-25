import { useCallback, useEffect, useState } from "react";
import { fetchLoyaltyOffers } from "@/features/loyalty/api";
import type { LoyaltyOffer } from "@/features/loyalty/types";

interface UseLoyaltyListParams {
  enabled: boolean;
  authHeaders: () => HeadersInit;
}

export function useLoyaltyList({ enabled, authHeaders }: UseLoyaltyListParams) {
  const [offers, setOffers] = useState<LoyaltyOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);

    fetchLoyaltyOffers(authHeaders, controller.signal)
      .then(setOffers)
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [authHeaders]);

  useEffect(() => {
    if (!enabled) return;
    return reload();
  }, [enabled, reload]);

  return { offers, loading, reload };
}
