import { useCallback, useEffect, useState } from "react";
import {
  createLoyaltyOffer,
  fetchLoyaltyOfferById,
  updateLoyaltyOffer,
} from "@/features/loyalty/api";
import type { LoyaltyFormData } from "@/features/loyalty/types";

type ImageField = "coverUrl" | "logoUrl" | "qrUrl";

const emptyForm: LoyaltyFormData = {
  title: "",
  discountLabel: "",
  coverUrl: "",
  logoUrl: "",
  qrUrl: "",
  status: "active",
};

interface UseLoyaltyFormParams {
  mode: "create" | "edit";
  offerId?: string;
  enabled: boolean;
  authHeaders: () => HeadersInit;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
  onSuccess: (offerId: number | string) => void;
}

export function useLoyaltyForm({
  mode,
  offerId,
  enabled,
  authHeaders,
  toast,
  onSuccess,
}: UseLoyaltyFormParams) {
  const [form, setForm] = useState<LoyaltyFormData>(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null);

  const loadOffer = useCallback(async () => {
    if (!offerId) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchLoyaltyOfferById(offerId, authHeaders);
      setForm({
        title: data.title || "",
        discountLabel: data.discountLabel || "",
        coverUrl: data.coverUrl || "",
        logoUrl: data.logoUrl || "",
        qrUrl: data.qrUrl || "",
        status: data.status || "active",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, offerId]);

  useEffect(() => {
    if (!enabled) return;

    if (mode === "edit") {
      loadOffer();
      return;
    }

    setLoading(false);
  }, [enabled, loadOffer, mode]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function uploadImage(field: ImageField) {
    return async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadingField(field);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        if (response.ok) {
          const { url } = await response.json();
          setForm((prev) => ({ ...prev, [field]: url }));
        } else {
          toast.error("Не удалось загрузить изображение");
        }
      } catch (error) {
        console.error(error);
        toast.error("Ошибка загрузки файла");
      } finally {
        setUploadingField(null);
      }
    };
  }

  function resetImage(field: ImageField) {
    setForm((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    if (!form.title.trim()) {
      toast.error("Введите название");
      return;
    }

    setSaving(true);
    try {
      const response =
        mode === "edit" && offerId
          ? await updateLoyaltyOffer(offerId, form, authHeaders)
          : await createLoyaltyOffer(form, authHeaders);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(
          data?.error ||
            (mode === "edit" ? "Не удалось сохранить" : "Не удалось создать"),
        );
        return;
      }

      const responseOffer = await response.json();
      toast.success(
        mode === "edit" ? "Карточка сохранена" : "Карточка создана",
      );
      onSuccess(
        mode === "edit" ? offerId || responseOffer.id : responseOffer.id,
      );
    } catch (error) {
      console.error(error);
      toast.error("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    setForm,
    loading,
    saving,
    uploadingField,
    handleChange,
    uploadImage,
    resetImage,
    handleSubmit,
  };
}
