"use client";

import { MessagesSquare } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/animated";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  ChatCreateForm,
  ChatListItem,
  createChat,
  deleteChat,
  useChats,
} from "@/features/chats";
import { useTelegram } from "@/integrations/telegram";

/** Страница «Чаты и каналы». */
export default function ChatsPage() {
  const { isLoading, isAdmin, authHeaders } = useTelegram();
  const toast = useToast();
  const { chatList, loading, appendChat, removeChat } = useChats({
    enabled: !isLoading,
    authHeaders,
  });

  // Форма добавления
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  async function handleAdd() {
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      const res = await createChat(
        {
          title: title.trim(),
          url: url.trim(),
          description: description.trim(),
        },
        authHeaders,
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка");
        return;
      }
      const row = await res.json();
      appendChat(row);
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
      const res = await deleteChat(id, authHeaders);
      if (res.ok) {
        removeChat(id);
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

      {loading ? (
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
            <ChatListItem
              key={chat.id}
              chat={chat}
              isAdmin={isAdmin}
              deleteOpen={deleteId === chat.id}
              onDeleteOpen={() => setDeleteId(chat.id)}
              onDeleteClose={() => setDeleteId(null)}
              onDeleteConfirm={() => {
                setDeleteId(null);
                handleDelete(chat.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Форма добавления — только для админов */}
      {isAdmin && (
        <section className="animate-slide-up stagger-2">
          <ChatCreateForm
            showForm={showForm}
            title={title}
            url={url}
            description={description}
            saving={saving}
            onTitleChange={setTitle}
            onUrlChange={setUrl}
            onDescriptionChange={setDescription}
            onSubmit={handleAdd}
            onOpen={() => setShowForm(true)}
            onCancel={() => {
              setShowForm(false);
              setTitle("");
              setUrl("");
              setDescription("");
            }}
          />
        </section>
      )}
    </div>
  );
}
