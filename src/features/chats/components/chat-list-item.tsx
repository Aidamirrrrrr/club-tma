import { ExternalLink, MessagesSquare, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ChatItem } from "@/features/chats/types";

interface ChatListItemProps {
  chat: ChatItem;
  isAdmin: boolean;
  deleteOpen: boolean;
  onDeleteOpen: () => void;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;
}

export function ChatListItem({
  chat,
  isAdmin,
  deleteOpen,
  onDeleteOpen,
  onDeleteClose,
  onDeleteConfirm,
}: ChatListItemProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
        <MessagesSquare className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{chat.title}</p>
        {chat.description && (
          <p className="truncate text-xs text-muted-foreground">
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
              open={deleteOpen}
              title="Удалить чат?"
              description="Ссылка будет удалена для всех участников."
              onConfirm={onDeleteConfirm}
              onCancel={onDeleteClose}
            />
            <button
              type="button"
              onClick={onDeleteOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
