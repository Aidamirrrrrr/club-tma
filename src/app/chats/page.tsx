"use client";

import { ExternalLink, MessagesSquare, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram";
import { EmptyState } from "@/components/ui/animated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

interface ChatItem {
  id: number;
  title: string;
  url: string;
  description: string;
  sort: number;
}

/** Страница «Чаты и каналы». */
export default function ChatsPage() {
  const { isLoading, isAdmin, authHeaders } = useTelegram();
  const toast = useToast();
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Форма добавления
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    fetch("/api/chats", { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setChatList)
      .catch((e) => console.error(e))
      .finally(() => setLoadingData(false));
  }, [isLoading, authHeaders]);

  async function handleAdd() {
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          description: description.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка");
        return;
      }
      const row = await res.json();
      setChatList((prev) => [...prev, row]);
      setTitle("");
      setUrl("");
      setDescription("");
      setShowForm(false);
      toast.success("Чат добавлен");
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setChatList((prev) => prev.filter((c) => c.id !== id));
        toast.success("Чат удалён");
      }
    } catch {
      toast.error("Ошибка");
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 px-4 pb-6">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold tracking-tight">Чаты и каналы</h1>
      </div>

      {loadingData ? (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </Card>
      ) : chatList.length === 0 && !isAdmin ? (
        <Card className="animate-slide-up stagger-1">
          <EmptyState icon={MessagesSquare} message="Чатов пока нет" />
        </Card>
      ) : (
        <div className="animate-slide-up stagger-1 flex flex-col gap-3">
          {chatList.map((chat) => (
            <Card key={chat.id} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
                <MessagesSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{chat.title}</p>
                {chat.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={chat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                {isAdmin && (
                  <>
                    <ConfirmDialog
                      open={deleteId === chat.id}
                      title="Удалить чат?"
                      description="Ссылка будет удалена для всех участников."
                      onConfirm={() => {
                        setDeleteId(null);
                        handleDelete(chat.id);
                      }}
                      onCancel={() => setDeleteId(null)}
                    />
                    <button
                      type="button"
                      onClick={() => setDeleteId(chat.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Форма добавления — только для админов */}
      {isAdmin && (
        <section className="animate-slide-up stagger-2">
          {showForm ? (
            <Card className="flex flex-col gap-4 p-4">
              <p className="text-sm font-semibold">Новый чат/канал</p>
              <Input
                placeholder="Название"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
              <Input
                placeholder="Ссылка (https://t.me/...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                maxLength={500}
              />
              <Textarea
                placeholder="Описание (необязательно)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!title.trim() || !url.trim() || saving}
                >
                  {saving ? "Сохранение..." : "Добавить"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setTitle("");
                    setUrl("");
                    setDescription("");
                  }}
                >
                  Отмена
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить чат
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
