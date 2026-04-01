"use client";

import { Ban, CheckCircle, Shield, ShieldOff, Star, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  MemberContactsCard,
  MemberEventsHistory,
  useMemberDetail,
} from "@/features/members";
import { useTelegram } from "@/integrations/telegram";
import { defaultGradient, getInitials, isImageUrl } from "@/lib/utils";

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, isLoading: authLoading, authHeaders } = useTelegram();
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [showTeamConfirm, setShowTeamConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const toast = useToast();
  const {
    member,
    loading,
    actionLoading,
    toggleRole,
    toggleBlock,
    toggleTeam,
  } = useMemberDetail({
    memberId: id,
    enabled: !authLoading,
    authHeaders,
    toast,
  });

  if (authLoading || loading) return <PageLoader />;
  if (!member)
    return (
      <div className="animate-fade-in py-20 text-center text-muted-foreground">
        Пользователь не найден
      </div>
    );

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div
        className="animate-fade-in overflow-clip rounded-b-3xl px-4 pb-6 transition-all duration-500 lg:rounded-3xl"
        style={
          isImageUrl(member.profileGradient)
            ? {
                backgroundImage: `linear-gradient(to bottom, transparent 40%, var(--background)), url(${member.profileGradient})`,
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
              {member.photoUrl && (
                <AvatarImage
                  src={member.photoUrl}
                  alt={`${member.firstName} ${member.lastName}`}
                />
              )}
              <AvatarFallback className="text-lg">
                {getInitials(member.firstName, member.lastName)}
              </AvatarFallback>
            </Avatar>
            {member.role === "admin" && (
              <span
                key={`star-${member.role}`}
                className="absolute -right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-3 ring-card shadow-md animate-bounce-in"
              >
                <Star className="h-3.5 w-3.5 fill-current" />
              </span>
            )}
          </div>
          <div className="animate-slide-up stagger-1">
            <h1 className="text-xl font-bold tracking-tight">
              {member.firstName} {member.lastName}
            </h1>
            {member.bio && (
              <p className="mx-auto mt-1.5 max-w-70 text-sm leading-relaxed text-muted-foreground">
                {member.bio}
              </p>
            )}
            <div className="mt-2 flex min-h-6 items-center justify-center gap-2">
              {member.role === "admin" && (
                <Badge
                  key={`badge-${member.role}`}
                  variant="success"
                  className="animate-bounce-in"
                >
                  Организатор
                </Badge>
              )}
              {member.isTeam && (
                <Badge
                  key="badge-team"
                  variant="default"
                  className="animate-bounce-in"
                >
                  D1 Команда
                </Badge>
              )}
              {member.blocked && (
                <Badge variant="danger" className="animate-bounce-in">
                  Заблокирован
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4">
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-5">
            <MemberContactsCard member={member} />

            {isAdmin && (
              <div className="animate-slide-up stagger-3 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowTeamConfirm(true)}
                  disabled={actionLoading}
                >
                  {member.isTeam ? (
                    <>
                      <Users className="h-4 w-4" /> Убрать из D1 Команды
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" /> Добавить в D1 Команду
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowRoleConfirm(true)}
                  disabled={actionLoading}
                >
                  {member.role === "admin" ? (
                    <>
                      <ShieldOff className="h-4 w-4" /> Снять организатора
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" /> Сделать организатором
                    </>
                  )}
                </Button>
                <Button
                  variant={member.blocked ? "default" : "destructive"}
                  className="w-full"
                  onClick={() => setShowBlockConfirm(true)}
                  disabled={actionLoading}
                >
                  {member.blocked ? (
                    <>
                      <CheckCircle className="h-4 w-4" /> Разблокировать
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" /> Заблокировать
                    </>
                  )}
                </Button>
                <ConfirmDialog
                  open={showTeamConfirm}
                  title={
                    member.isTeam
                      ? "Убрать из D1 Команды"
                      : "Добавить в D1 Команду"
                  }
                  description={
                    member.isTeam
                      ? `Убрать ${member.firstName} из D1 Команды?`
                      : `Добавить ${member.firstName} в D1 Команду?`
                  }
                  confirmLabel="Подтвердить"
                  onConfirm={async () => {
                    await toggleTeam();
                    setShowTeamConfirm(false);
                  }}
                  onCancel={() => setShowTeamConfirm(false)}
                />
                <ConfirmDialog
                  open={showRoleConfirm}
                  title={
                    member.role === "admin"
                      ? "Снять организатора"
                      : "Назначить организатором"
                  }
                  description={
                    member.role === "admin"
                      ? `Снять роль организатора у ${member.firstName}?`
                      : `Назначить ${member.firstName} организатором?`
                  }
                  confirmLabel="Подтвердить"
                  onConfirm={async () => {
                    await toggleRole();
                    setShowRoleConfirm(false);
                  }}
                  onCancel={() => setShowRoleConfirm(false)}
                />
                <ConfirmDialog
                  open={showBlockConfirm}
                  title={member.blocked ? "Разблокировать" : "Заблокировать"}
                  description={
                    member.blocked
                      ? `Разблокировать ${member.firstName}?`
                      : `Заблокировать ${member.firstName}? Пользователь потеряет доступ.`
                  }
                  confirmLabel={
                    member.blocked ? "Разблокировать" : "Заблокировать"
                  }
                  variant={member.blocked ? "default" : "destructive"}
                  onConfirm={async () => {
                    await toggleBlock();
                    setShowBlockConfirm(false);
                  }}
                  onCancel={() => setShowBlockConfirm(false)}
                />
              </div>
            )}
          </div>
          <MemberEventsHistory events={member.events || []} />
        </div>
      </div>
    </div>
  );
}
