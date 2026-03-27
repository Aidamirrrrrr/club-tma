import type {
  UserDetailResponse,
  UserListItemResponse,
} from "@/contracts/users";

export async function fetchMembers(
  params: URLSearchParams,
  authHeaders: () => HeadersInit,
  signal?: AbortSignal,
) {
  const response = await fetch(`/api/users?${params.toString()}`, {
    headers: authHeaders(),
    signal,
  });

  if (!response.ok) {
    throw response;
  }

  return (await response.json()) as UserListItemResponse[];
}

export async function fetchMemberById(
  memberId: string,
  authHeaders: () => HeadersInit,
) {
  const response = await fetch(`/api/users/${memberId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw response;
  }

  return (await response.json()) as UserDetailResponse;
}

export async function updateMember(
  memberId: number,
  payload: Record<string, unknown>,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/users/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}
