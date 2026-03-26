"use client";

import {
  CheckCircle,
  Clock,
  MessageSquarePlus,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram";
import { EmptyState } from "@/components/ui/animated";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDate, getInitials } from "@/lib/utils";

interface CommunityRequestItem {
  id: number;
  message: string;
  status: "pending" | "reviewed";
  createdAt: string;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
}

/** Страница «Запрос в сообщество». */
export default function CommunityRequestPage() {
  const { isLoading, isAdmin, authHeaders } = useTelegram();
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Список запросов — только для админов
  const [requests, setRequests] = useState<CommunityRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    setLoadingRequests(true);
    fetch("/api/community-requests", { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setRequests)
      .catch((e) => console.error(e))
      .finally(() => setLoadingRequests(false));
  }, [isLoading, isAdmin, authHeaders]);

  async function handleSubmit() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/community-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ message: message.trim() }),
      });
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
      const res = await fetch(`/api/community-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: "reviewed" }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "reviewed" } : r)),
        );
        toast.success("Отмечено как просмотренное");
      }
    } catch {
      toast.error("Ошибка");
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/community-requests/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
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

      {/* Форма отправки — для всех пользователей */}
      <Card className="animate-slide-up stagger-1 flex flex-col gap-4 p-4">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold">Запрос отправлен!</p>
              <p className="text-sm text-muted-foreground">
                Администратор рассмотрит ваше пожелание
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSent(false)}>
              Отправить ещё
            </Button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold">Ваше пожелание</p>
              <p className="text-xs text-muted-foreground">
                Опишите что бы вы хотели видеть в сообществе
              </p>
            </div>
            <Textarea
              placeholder="Напишите ваш запрос..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={4}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {message.length} / 2000
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Отправка..." : "Отправить"}
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Список запросов — только для админов */}
      {isAdmin && (
        <section className="animate-slide-up stagger-2 flex flex-col gap-4">
          <h2 className="text-base font-semibold tracking-tight">
            Все запросы
          </h2>
          {loadingRequests ? (
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
                <Card key={req.id} className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {req.photoUrl && <AvatarImage src={req.photoUrl} />}
                      <AvatarFallback className="text-xs">
                        {getInitials(req.firstName || "", req.lastName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {req.firstName} {req.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(req.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        req.status === "reviewed" ? "default" : "warning"
                      }
                    >
                      {req.status === "reviewed" ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" /> Просмотрен
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" /> Новый
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {req.message}
                  </p>
                  <ConfirmDialog
                    open={deleteId === req.id}
                    title="Удалить запрос?"
                    description="Это действие нельзя отменить."
                    onConfirm={() => {
                      setDeleteId(null);
                      handleDelete(req.id);
                    }}
                    onCancel={() => setDeleteId(null)}
                  />
                  <div className="flex gap-2">
                    {req.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkReviewed(req.id)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Просмотрено
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(req.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Удалить
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
