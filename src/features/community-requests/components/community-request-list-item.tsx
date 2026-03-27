import { CheckCircle, Clock, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { CommunityRequestItem } from "@/features/community-requests/types";
import { formatDate, getInitials } from "@/lib/utils";

interface CommunityRequestListItemProps {
  request: CommunityRequestItem;
  deleteOpen: boolean;
  onDeleteOpen: () => void;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;
  onMarkReviewed: () => void;
}

export function CommunityRequestListItem({
  request,
  deleteOpen,
  onDeleteOpen,
  onDeleteClose,
  onDeleteConfirm,
  onMarkReviewed,
}: CommunityRequestListItemProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          {request.photoUrl && <AvatarImage src={request.photoUrl} />}
          <AvatarFallback className="text-xs">
            {getInitials(request.firstName || "", request.lastName || "")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {request.firstName} {request.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatDate(request.createdAt)}
          </p>
        </div>
        <Badge variant={request.status === "reviewed" ? "default" : "warning"}>
          {request.status === "reviewed" ? (
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
      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        {request.message}
      </p>
      <ConfirmDialog
        open={deleteOpen}
        title="Удалить запрос?"
        description="Это действие нельзя отменить."
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteClose}
      />
      <div className="flex gap-2">
        {request.status === "pending" && (
          <Button variant="outline" size="sm" onClick={onMarkReviewed}>
            <CheckCircle className="mr-1 h-3 w-3" />
            Просмотрено
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onDeleteOpen}>
          <Trash2 className="mr-1 h-3 w-3" />
          Удалить
        </Button>
      </div>
    </Card>
  );
}
