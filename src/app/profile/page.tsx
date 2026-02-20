"use client";

import { useState, useEffect } from "react";
import {
  Instagram,
  Send,
  Phone,
  CalendarDays,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { PageLoader } from "@/components/ui/spinner";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

interface UserEvent {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventStatus: string;
}

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl: string;
  bio: string;
  instagram: string;
  telegram: string;
  phone: string;
  role: string;
  events: UserEvent[];
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

export default function ProfilePage() {
  const { dbUser, isLoading, refetchUser, authHeaders } = useTelegram();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    instagram: "",
    telegram: "",
    phone: "",
    photoUrl: "",
  });

  const loadProfile = async () => {
    if (!dbUser) return;
    try {
      const res = await fetch(`/api/users/${dbUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          bio: data.bio || "",
          instagram: data.instagram || "",
          telegram: data.telegram || "",
          phone: data.phone || "",
          photoUrl: data.photoUrl || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbUser) {
      loadProfile();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [dbUser, isLoading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!dbUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${dbUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditing(false);
        await loadProfile();
        await refetchUser();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) return <PageLoader />;
  if (!profile)
    return (
      <div className="animate-fade-in py-20 text-center text-muted-foreground">
        Профиль не найден
      </div>
    );

  const upcomingEvents =
    profile.events?.filter(
      (e) => e.eventStatus === "open" || e.eventStatus === "closed",
    ) || [];
  const pastEvents =
    profile.events?.filter(
      (e) => e.eventStatus === "completed" || e.eventStatus === "cancelled",
    ) || [];

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="animate-fade-in flex items-center justify-between">
        {!editing ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4" />
            Редактировать
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "..." : "Сохранить"}
            </Button>
          </div>
        )}
      </div>

      {/* Avatar & Name */}
      <div className="animate-fade-in -mx-4 -mt-2 overflow-hidden rounded-b-3xl bg-linear-to-b from-primary/10 to-transparent px-4 pb-6 pt-4 lg:rounded-3xl lg:mx-0 lg:mt-0">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="animate-bounce-in relative">
            <Avatar size="lg" className="size-24! ring-4 ring-card shadow-lg">
              {profile.photoUrl && (
                <AvatarImage
                  src={profile.photoUrl}
                  alt={`${profile.firstName} ${profile.lastName}`}
                />
              )}
              <AvatarFallback className="text-lg">
                {getInitials(profile.firstName, profile.lastName)}
              </AvatarFallback>
            </Avatar>
            {profile.role === "admin" && (
              <span className="absolute -right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-3 ring-card shadow-md">
                ★
              </span>
            )}
          </div>
          {editing ? (
            <div className="flex w-full gap-2">
              <Input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Имя"
              />
              <Input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Фамилия"
              />
            </div>
          ) : (
            <div className="animate-slide-up stagger-1">
              <h2 className="text-xl font-bold tracking-tight">
                {profile.firstName} {profile.lastName}
              </h2>
              {profile.role === "admin" && (
                <Badge variant="success" className="mt-1.5">
                  Администратор
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {editing ? (
        <FormTextarea
          label="О себе"
          name="bio"
          id="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Расскажите о себе..."
        />
      ) : (
        profile.bio && (
          <Card className="animate-slide-up stagger-1">
            <p className="text-sm leading-relaxed">{profile.bio}</p>
          </Card>
        )
      )}

      {/* Contacts + Events: two-column on desktop */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          {/* Contacts */}
          {editing ? (
            <div className="flex flex-col gap-3">
              <FormField
                label="Instagram"
                name="instagram"
                id="instagram"
                value={form.instagram}
                onChange={handleChange}
                placeholder="@username"
              />
              <FormField
                label="Telegram"
                name="telegram"
                id="telegram"
                value={form.telegram}
                onChange={handleChange}
                placeholder="@username"
              />
              <FormField
                label="Телефон"
                name="phone"
                id="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+7..."
              />
              <FormField
                label="URL фото профиля"
                name="photoUrl"
                id="photoUrl"
                value={form.photoUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          ) : (
            <Card className="animate-slide-up stagger-2 flex flex-col gap-0 divide-y divide-border p-0">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Instagram className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Instagram</p>
                    <p className="font-medium">{profile.instagram}</p>
                  </div>
                </a>
              )}
              {profile.telegram && (
                <a
                  href={`https://t.me/${profile.telegram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Send className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Telegram</p>
                    <p className="font-medium">{profile.telegram}</p>
                  </div>
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Телефон</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                </a>
              )}
              {!profile.instagram && !profile.telegram && !profile.phone && (
                <p className="px-4 py-4 text-center text-sm text-muted-foreground">
                  Добавьте контактную информацию
                </p>
              )}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {/* Upcoming events */}
          <section className="animate-slide-up stagger-3">
            <h2 className="mb-3 text-base font-semibold tracking-tight">
              Предстоящие мероприятия ({upcomingEvents.length})
            </h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Вы не зарегистрированы на мероприятия
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingEvents.map((ev) => (
                  <Link key={ev.eventId} href={`/events/${ev.eventId}`}>
                    <Card className="card-interactive flex items-center gap-3 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ev.eventTitle}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(ev.eventDate)}
                          {ev.eventTime && `, ${ev.eventTime}`}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Past events */}
          {pastEvents.length > 0 && (
            <section className="animate-slide-up stagger-4">
              <h2 className="mb-3 text-base font-semibold tracking-tight">
                История ({pastEvents.length})
              </h2>
              <div className="flex flex-col gap-2">
                {pastEvents.map((ev) => (
                  <Link key={ev.eventId} href={`/events/${ev.eventId}`}>
                    <Card className="card-interactive flex items-center gap-3 p-3 opacity-60">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ev.eventTitle}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(ev.eventDate)}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMM yyyy", { locale: ru });
  } catch {
    return dateStr;
  }
}
