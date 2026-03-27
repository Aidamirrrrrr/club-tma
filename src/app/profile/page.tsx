"use client";

import { Camera, ImagePlus, Pencil, Save, Star, Trash2, X } from "lucide-react";
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  ProfileContactLinks,
  ProfileEventsSection,
  useProfile,
} from "@/features/profile";
import { useTelegram } from "@/integrations/telegram";
import { defaultGradient, getInitials, isImageUrl } from "@/lib/utils";

/** Страница профиля текущего пользователя. */
export default function ProfilePage() {
  const { dbUser, isLoading, refetchUser, authHeaders } = useTelegram();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const {
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
  } = useProfile({
    userId: dbUser?.id,
    enabled: !isLoading,
    authHeaders,
    refetchUser,
    toast,
  });

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
              <Button size="sm" onClick={saveProfile} disabled={saving}>
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
                      onClick={resetBackground}
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
              <ProfileContactLinks profile={profile} />
            )}
          </div>

          <div className="flex flex-col gap-5">
            <ProfileEventsSection
              title="Предстоящие мероприятия"
              events={upcomingEvents}
              emptyMessage="Вы не зарегистрированы на мероприятия"
            />

            {pastEvents.length > 0 && (
              <ProfileEventsSection
                title="История"
                events={pastEvents}
                emptyMessage=""
                faded
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
