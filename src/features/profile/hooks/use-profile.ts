import { useCallback, useEffect, useState } from "react";
import {
  fetchProfile,
  updateProfile,
  uploadFile,
} from "@/features/profile/api";
import type { ProfileData, ProfileFormData } from "@/features/profile/types";

const emptyForm: ProfileFormData = {
  firstName: "",
  lastName: "",
  bio: "",
  instagram: "",
  telegram: "",
  phone: "",
  photoUrl: "",
  profileGradient: "default",
};

function toFormData(profile: ProfileData): ProfileFormData {
  return {
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    bio: profile.bio || "",
    instagram: profile.instagram || "",
    telegram: profile.telegram || "",
    phone: profile.phone || "",
    photoUrl: profile.photoUrl || "",
    profileGradient: profile.profileGradient || "default",
  };
}

interface UseProfileParams {
  userId?: number;
  enabled: boolean;
  authHeaders: () => HeadersInit;
  refetchUser: () => Promise<unknown> | unknown;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

export function useProfile({
  userId,
  enabled,
  authHeaders,
  refetchUser,
  toast,
}: UseProfileParams) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const data = await fetchProfile(userId, authHeaders);
      setProfile(data);
      setForm(toFormData(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, userId]);

  useEffect(() => {
    if (enabled && userId) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [enabled, loadProfile, userId]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    let masked = value;

    if (name === "instagram" || name === "telegram") {
      masked = value.replace(/[^a-zA-Z0-9._]/g, "");
      if (masked && !masked.startsWith("@")) masked = `@${masked}`;
      if (masked === "@") masked = "";
    } else if (name === "phone") {
      const raw = value.replace(/[^\d+]/g, "");
      if (raw.startsWith("+") || raw.length > 0) {
        const plus = raw.startsWith("+");
        const digits = raw.replace(/\D/g, "");
        if (digits.length > 0) {
          let formatted = "+";
          const clampedDigits = digits.slice(0, 15);
          for (let index = 0; index < clampedDigits.length; index += 3) {
            if (index > 0) formatted += " ";
            formatted += clampedDigits.slice(index, index + 3);
          }
          masked = formatted;
        } else {
          masked = plus ? "+" : "";
        }
      } else {
        masked = "";
      }
    }

    setForm((prev) => ({ ...prev, [name]: masked }));
  }

  function startEditing() {
    if (profile) {
      setForm(toFormData(profile));
    }
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    if (profile) {
      setForm(toFormData(profile));
    }
  }

  async function saveProfile() {
    if (!userId) return;

    setSaving(true);
    try {
      const response = await updateProfile(userId, form, authHeaders);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(data?.error || "Не удалось сохранить профиль");
        return;
      }

      setEditing(false);
      toast.success("Профиль сохранён");
      await loadProfile();
      await refetchUser();
    } catch (error) {
      console.error(error);
      toast.error("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfileFile(
    file: File,
    field: "photoUrl" | "profileGradient",
  ) {
    const setUploadingState =
      field === "photoUrl" ? setUploading : setUploadingBg;
    const loadingError =
      field === "photoUrl"
        ? "Не удалось загрузить фото"
        : "Не удалось загрузить фон";

    setUploadingState(true);
    try {
      const response = await uploadFile(file, authHeaders);

      if (!response.ok) {
        toast.error(loadingError);
        return;
      }

      const { url } = await response.json();
      setForm((prev) => ({ ...prev, [field]: url }));
    } catch (error) {
      console.error(error);
      toast.error("Ошибка загрузки файла");
    } finally {
      setUploadingState(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadProfileFile(file, "photoUrl");
  }

  async function handleBgUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadProfileFile(file, "profileGradient");
  }

  function resetBackground() {
    setForm((prev) => ({ ...prev, profileGradient: "default" }));
  }

  return {
    profile,
    form,
    loading,
    editing,
    saving,
    uploading,
    uploadingBg,
    handleChange,
    startEditing,
    cancelEditing,
    saveProfile,
    handleFileUpload,
    handleBgUpload,
    resetBackground,
  };
}
