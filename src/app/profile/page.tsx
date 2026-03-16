"use client";

import {
  CalendarDays,
  Camera,
  ImagePlus,
  Pencil,
  Phone,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { InstagramIcon, TelegramIcon } from "@/components/icons";
import { useTelegram } from "@/components/telegram";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  defaultGradient,
  formatDate,
  getInitials,
  isImageUrl,
} from "@/lib/utils";

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

/** Страница профиля текущего пользователя. */
export default function ProfilePage() {
  const { dbUser, isLoading, refetchUser, authHeaders } = useTelegram();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
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
      const res = await fetch(`/api/users/${dbUser.id}`, {
        headers: authHeaders(),
      });
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadProfile зависит от dbUser
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
    const { name, value } = e.target;
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
          const d = digits.slice(0, 15);
          for (let i = 0; i < d.length; i += 3) {
            if (i > 0) formatted += " ";
            formatted += d.slice(i, i + 3);
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
        toast.success("Профиль сохранён");
        await loadProfile();
        await refetchUser();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Не удалось сохранить профиль");
      }
    } catch (e) {
      console.error(e);
      toast.error("Ошибка сети");
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
      } else {
        toast.error("Не удалось загрузить фото");
      }
    } catch (e) {
      console.error(e);
      toast.error("Ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
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
        setForm((prev) => ({ ...prev, profileGradient: url }));
      } else {
        toast.error("Не удалось загрузить фон");
      }
    } catch (e) {
      console.error(e);
      toast.error("Ошибка загрузки файла");
    } finally {
      setUploadingBg(false);
    }
  };

  if (isLoading || loading) return <PageLoader />;
  if (!profile)
    return (
      <div className="animate-fade-in flex flex-col items-center gap-4 py-20 text-center text-muted-foreground">
        <p>Профиль не найден</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Попробовать снова
        </Button>
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

  const currentBg = editing ? form.profileGradient : profile.profileGradient;
  const hasBgImage = isImageUrl(currentBg);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div
        className="animate-fade-in overflow-clip rounded-b-3xl px-4 pb-6 transition-all duration-500 lg:rounded-3xl"
        style={
          hasBgImage
            ? {
                backgroundImage: `linear-gradient(to bottom, transparent 40%, var(--background)), url(${currentBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                paddingTop:
                  "max(calc(var(--tg-viewport-safe-area-inset-top, 0px) + var(--tg-viewport-content-safe-area-inset-top, 0px) + 32px), 24px)",
              }
            : {
                background: defaultGradient,
                paddingTop:
                  "max(calc(var(--tg-viewport-safe-area-inset-top, 0px) + var(--tg-viewport-content-safe-area-inset-top, 0px) + 32px), 24px)",
              }
        }
      >
        <div className="flex flex-col items-center gap-3 text-center">
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
              <span className="absolute -right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-3 ring-card shadow-md animate-bounce-in">
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
                  Организатор
                </Badge>
              )}
            </div>
          )}

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

      <div className="flex flex-col gap-5 px-4">
        {editing && (
          <Card className="animate-slide-up">
            <div className="mb-3 flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Фон профиля</span>
            </div>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBgUpload}
            />
            <div className="flex items-center gap-3">
              {isImageUrl(form.profileGradient) ? (
                <div className="relative h-20 w-full overflow-hidden rounded-xl">
                  {/* biome-ignore lint/performance/noImgElement: user-uploaded dynamic content */}
                  <img
                    src={form.profileGradient}
                    alt="Фон"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => bgInputRef.current?.click()}
                      disabled={uploadingBg}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Заменить
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          profileGradient: "default",
                        }))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => bgInputRef.current?.click()}
                  disabled={uploadingBg}
                  className="flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border transition-colors hover:bg-muted/50"
                >
                  {uploadingBg ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Загрузить изображение
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </Card>
        )}

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

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-5">
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
                  maxLength={32}
                />
                <FormField
                  label="Telegram"
                  name="telegram"
                  id="telegram"
                  value={form.telegram}
                  onChange={handleChange}
                  placeholder="@username"
                  maxLength={34}
                />
                <FormField
                  label="Телефон"
                  name="phone"
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+7 900 123 45 67"
                  maxLength={18}
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1306C]/15">
                      <InstagramIcon className="h-4.5 w-4.5 text-[#E1306C]" />
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2AABEE]/15">
                      <TelegramIcon className="h-4.5 w-4.5 text-[#2AABEE]" />
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#34C759]/15">
                      <Phone className="h-4 w-4 text-[#34C759]" />
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                          <CalendarDays className="h-4 w-4 text-primary-foreground" />
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
    </div>
  );
}
