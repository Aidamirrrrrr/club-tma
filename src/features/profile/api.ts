import type { ProfileData, ProfileFormData } from "@/features/profile/types";

export async function fetchProfile(
  userId: number,
  authHeaders: () => HeadersInit,
) {
  const response = await fetch(`/api/users/${userId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw response;
  }

  return (await response.json()) as ProfileData;
}

export async function updateProfile(
  userId: number,
  form: ProfileFormData,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(form),
  });
}

export async function uploadFile(file: File, authHeaders: () => HeadersInit) {
  const formData = new FormData();
  formData.append("file", file);

  return fetch("/api/upload", {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
}
