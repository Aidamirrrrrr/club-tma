"use client";

import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/animated";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  CommunityRequestForm,
  CommunityRequestListItem,
  createCommunityRequest,
  deleteCommunityRequest,
  reviewCommunityRequest,
  useCommunityRequests,
} from "@/features/community-requests";
import { useTelegram } from "@/integrations/telegram";

/** Страница «Запрос в сообщество». */
export default function CommunityRequestPage() {
  const { isLoading, isAdmin, authHeaders } = useTelegram();
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { requests, loading, removeRequest, markReviewed } =
    useCommunityRequests({
      enabled: !isLoading && isAdmin,
      authHeaders,
    });

  async function handleSubmit() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await createCommunityRequest(message.trim(), authHeaders);
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка отправки");
        return;
      }
      setSent(true);
      setMessage("");
      toast.success("Запрос отправлен!");
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSending(false);
    }
  }

  async function handleMarkReviewed(id: number) {
    try {
      const res = await reviewCommunityRequest(id, authHeaders);
      if (res.ok) {
        markReviewed(id);
        toast.success("Отмечено как просмотренное");
      }
    } catch {
      toast.error("Ошибка");
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await deleteCommunityRequest(id, authHeaders);
      if (res.ok) {
        removeRequest(id);
        toast.success("Запрос удалён");
      }
    } catch {
      toast.error("Ошибка");
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 px-4 pb-6">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold tracking-tight">
          Запрос в сообщество
        </h1>
      </div>

      <CommunityRequestForm
        sent={sent}
        message={message}
        sending={sending}
        onMessageChange={setMessage}
        onSubmit={handleSubmit}
        onResetSent={() => setSent(false)}
      />

      {/* Список запросов — только для админов */}
      {isAdmin && (
        <section className="animate-slide-up stagger-2 flex flex-col gap-4">
          <h2 className="text-base font-semibold tracking-tight">
            Все запросы
          </h2>
          {loading ? (
            <Card className="p-6">
              <div className="flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <EmptyState
                icon={MessageSquarePlus}
                message="Запросов пока нет"
              />
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map((req) => (
                <CommunityRequestListItem
                  key={req.id}
                  request={req}
                  deleteOpen={deleteId === req.id}
                  onDeleteOpen={() => setDeleteId(req.id)}
                  onDeleteClose={() => setDeleteId(null)}
                  onDeleteConfirm={() => {
                    setDeleteId(null);
                    handleDelete(req.id);
                  }}
                  onMarkReviewed={() => handleMarkReviewed(req.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
