import { useCallback, useEffect, useState } from "react";
import { fetchMemberById, updateMember } from "@/features/members/api";
import type { MemberDetail } from "@/features/members/types";

interface UseMemberDetailParams {
  memberId?: string;
  enabled: boolean;
  authHeaders: () => HeadersInit;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

export function useMemberDetail({
  memberId,
  enabled,
  authHeaders,
  toast,
}: UseMemberDetailParams) {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMember = useCallback(async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }

    try {
      setMember(await fetchMemberById(memberId, authHeaders));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, memberId]);

  useEffect(() => {
    if (!enabled) return;
    loadMember();
  }, [enabled, loadMember]);

  async function toggleRole() {
    if (!member || actionLoading) return;

    const newRole = member.role === "admin" ? "user" : "admin";
    setActionLoading(true);
    try {
      const response = await updateMember(
        member.id,
        { role: newRole },
        authHeaders,
      );
      if (!response.ok) {
        toast.error("Не удалось изменить роль");
        return;
      }

      toast.success(
        newRole === "admin"
          ? "Назначен организатором"
          : "Роль организатора снята",
      );
      await loadMember();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось изменить роль");
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleBlock() {
    if (!member || actionLoading) return;

    setActionLoading(true);
    try {
      const response = await updateMember(
        member.id,
        { blocked: !member.blocked },
        authHeaders,
      );
      if (!response.ok) {
        toast.error("Не удалось выполнить действие");
        return;
      }

      toast.success(
        member.blocked
          ? "Пользователь разблокирован"
          : "Пользователь заблокирован",
      );
      await loadMember();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось выполнить действие");
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleTeam() {
    if (!member || actionLoading) return;

    setActionLoading(true);
    try {
      const response = await updateMember(
        member.id,
        { isTeam: !member.isTeam },
        authHeaders,
      );
      if (!response.ok) {
        toast.error("Не удалось изменить статус команды");
        return;
      }

      toast.success(
        member.isTeam ? "Убран из D1 Команды" : "Добавлен в D1 Команду",
      );
      await loadMember();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось изменить статус команды");
    } finally {
      setActionLoading(false);
    }
  }

  return {
    member,
    loading,
    actionLoading,
    toggleRole,
    toggleBlock,
    toggleTeam,
  };
}
