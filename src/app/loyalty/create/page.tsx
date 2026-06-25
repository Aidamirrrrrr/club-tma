"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { LoyaltyForm, useLoyaltyForm } from "@/features/loyalty";
import { useTelegram } from "@/integrations/telegram";

/** Страница создания карточки лояльности (только админ). */
export default function CreateLoyaltyPage() {
  const router = useRouter();
  const { isAdmin, isLoading, authHeaders } = useTelegram();
  const { success, error: showError } = useToast();
  const state = useLoyaltyForm({
    mode: "create",
    enabled: !isLoading,
    authHeaders,
    toast: { success, error: showError },
    onSuccess: () => router.push("/loyalty"),
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push("/loyalty");
  }, [isLoading, isAdmin, router]);

  if (isLoading || state.loading || !isAdmin) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 lg:mx-auto lg:max-w-lg">
      <h1 className="animate-slide-up text-xl font-bold tracking-tight">
        Создать карточку
      </h1>
      <LoyaltyForm state={state} submitLabel="Создать карточку" />
    </div>
  );
}
