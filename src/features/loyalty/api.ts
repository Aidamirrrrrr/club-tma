import type { LoyaltyFormData, LoyaltyOffer } from "@/features/loyalty/types";

export async function fetchLoyaltyOffers(
  authHeaders: () => HeadersInit,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/loyalty", {
    headers: authHeaders(),
    signal,
  });

  if (!response.ok) {
    throw response;
  }

  return (await response.json()) as LoyaltyOffer[];
}

export async function fetchLoyaltyOfferById(
  offerId: string,
  authHeaders: () => HeadersInit,
) {
  const response = await fetch(`/api/loyalty/${offerId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw response;
  }

  return (await response.json()) as LoyaltyOffer;
}

export async function createLoyaltyOffer(
  form: LoyaltyFormData,
  authHeaders: () => HeadersInit,
) {
  return fetch("/api/loyalty", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(form),
  });
}

export async function updateLoyaltyOffer(
  offerId: string,
  form: LoyaltyFormData,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/loyalty/${offerId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(form),
  });
}

export async function deleteLoyaltyOffer(
  offerId: number,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/loyalty/${offerId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
