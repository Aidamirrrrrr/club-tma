import type { CommunityRequestItem } from "@/features/community-requests/types";

export async function fetchCommunityRequests(authHeaders: () => HeadersInit) {
  const response = await fetch("/api/community-requests", {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw response;
  }

  return (await response.json()) as CommunityRequestItem[];
}

export async function createCommunityRequest(
  message: string,
  authHeaders: () => HeadersInit,
) {
  return fetch("/api/community-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ message }),
  });
}

export async function reviewCommunityRequest(
  requestId: number,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/community-requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status: "reviewed" }),
  });
}

export async function deleteCommunityRequest(
  requestId: number,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/community-requests/${requestId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
