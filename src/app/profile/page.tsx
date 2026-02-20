"use client";

import { useState, useEffect, useRef } from "react";
import {
  Phone,
  CalendarDays,
  Pencil,
  Save,
  X,
  Star,
  Camera,
  Palette,
} from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { PageLoader } from "@/components/ui/spinner";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

/* ── Brand Icons ── */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"
        fill="currentColor"
      />
      <path
        d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8z"
        fill="currentColor"
      />
      <circle cx="18.406" cy="5.594" r="1.44" fill="currentColor" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/* ── Gradient Presets ── */
const gradientPresets = [
  {
    id: "default",
    label: "Зелёный",
    color: "#86efac",
    style:
      "linear-gradient(to bottom, oklch(0.881 0.18 130.6 / 0.12), transparent)",
  },
  {
    id: "blue",
    label: "Синий",
    color: "#93c5fd",
    style:
      "linear-gradient(to bottom, oklch(0.65 0.18 260 / 0.15), transparent)",
  },
  {
    id: "purple",
    label: "Фиолет",
    color: "#c4b5fd",
    style:
      "linear-gradient(to bottom, oklch(0.65 0.18 300 / 0.15), transparent)",
  },
  {
    id: "pink",
    label: "Розовый",
    color: "#f9a8d4",
    style:
      "linear-gradient(to bottom, oklch(0.72 0.18 350 / 0.15), transparent)",
  },
  {
    id: "orange",
    label: "Оранж",
    color: "#fdba74",
    style:
      "linear-gradient(to bottom, oklch(0.75 0.16 55 / 0.18), transparent)",
  },
  {
    id: "cyan",
    label: "Голубой",
    color: "#67e8f9",
    style:
      "linear-gradient(to bottom, oklch(0.78 0.14 200 / 0.15), transparent)",
  },
];

function getGradientStyle(id: string | undefined): string {
  return (
    gradientPresets.find((g) => g.id === id)?.style ?? gradientPresets[0].style
  );
}

/* ── Types ── */
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
  profileGradient: string;
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    instagram: "",
    telegram: "",
    phone: "",
    photoUrl: "",
    profileGradient: "default",
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
          profileGradient: data.profileGradient || "default",
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

  const startEditing = () => {
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        bio: profile.bio || "",
        instagram: profile.instagram || "",
        telegram: profile.telegram || "",
        phone: profile.phone || "",
        photoUrl: profile.photoUrl || "",
        profileGradient: profile.profileGradient || "default",
      });
    }
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        bio: profile.bio || "",
        instagram: profile.instagram || "",
        telegram: profile.telegram || "",
        phone: profile.phone || "",
        photoUrl: profile.photoUrl || "",
        profileGradient: profile.profileGradient || "default",
      });
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => ({ ...prev, photoUrl: url }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
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

  const currentGradient = editing
    ? getGradientStyle(form.profileGradient)
    : getGradientStyle(profile.profileGradient);

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Avatar & Name Header */}
      <div
        className="animate-fade-in -mx-4 -mt-2 overflow-hidden rounded-b-3xl px-4 pb-6 pt-4 transition-all duration-500 lg:mx-0 lg:mt-0 lg:rounded-3xl"
        style={{ background: currentGradient }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Avatar with edit overlay */}
          <div className="animate-bounce-in relative">
            <Avatar size="lg" className="size-24! ring-4 ring-card shadow-lg">
              {(editing ? form.photoUrl : profile.photoUrl) && (
                <AvatarImage
                  src={editing ? form.photoUrl : profile.photoUrl}
                  alt={`${profile.firstName} ${profile.lastName}`}
                />
              )}
              <AvatarFallback className="text-lg">
                {getInitials(
                  editing ? form.firstName : profile.firstName,
                  editing ? form.lastName : profile.lastName,
                )}
              </AvatarFallback>
            </Avatar>
            {profile.role === "admin" && !editing && (
              <span className="absolute -right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-3 ring-card shadow-md">
                <Star className="h-3.5 w-3.5 fill-current" />
              </span>
            )}
            {editing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white transition-opacity hover:bg-black/50"
                >
                  {uploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Name */}
          {editing ? (
            <div className="flex w-full max-w-xs gap-2">
              <Input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Имя"
                className="bg-card/80 text-center backdrop-blur-sm"
              />
              <Input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Фамилия"
                className="bg-card/80 text-center backdrop-blur-sm"
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

          {/* Edit / Save / Cancel buttons — in the header */}
          {!editing ? (
            <Button
              size="sm"
              variant="secondary"
              className="mt-1"
              onClick={startEditing}
            >
              <Pencil className="h-3.5 w-3.5" />
              Редактировать
            </Button>
          ) : (
            <div className="mt-1 flex gap-2">
              <Button size="sm" variant="secondary" onClick={cancelEditing}>
                <X className="h-3.5 w-3.5" />
                Отмена
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-3.5 w-3.5" />
                {saving ? "..." : "Сохранить"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Gradient picker — only in edit mode */}
      {editing && (
        <Card className="animate-slide-up">
          <div className="mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Фон профиля</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gradientPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    profileGradient: preset.id,
                  }))
                }
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
                  form.profileGradient === preset.id
                    ? "bg-foreground/8 ring-2 ring-primary"
                    : "hover:bg-foreground/4"
                }`}
              >
                <div
                  className="h-8 w-8 rounded-full shadow-sm ring-1 ring-border"
                  style={{ background: preset.color }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Bio */}
      {editing ? (
        <Card className="animate-slide-up stagger-1">
          <FormTextarea
            label="О себе"
            name="bio"
            id="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Расскажите о себе..."
          />
        </Card>
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
            <Card className="animate-slide-up stagger-2 flex flex-col gap-4">
              <h3 className="text-sm font-semibold">Контакты</h3>
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
            </Card>
          ) : (
            <Card className="animate-slide-up stagger-2 flex flex-col gap-0 divide-y divide-border p-0">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-purple-500/15 to-pink-500/15">
                    <InstagramIcon className="h-4.5 w-4.5 text-pink-600" />
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                    <TelegramIcon className="h-4.5 w-4.5 text-sky-500" />
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Phone className="h-4 w-4 text-emerald-600" />
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
