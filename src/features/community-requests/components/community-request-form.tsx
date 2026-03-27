import { CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface CommunityRequestFormProps {
  sent: boolean;
  message: string;
  sending: boolean;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
  onResetSent: () => void;
}

export function CommunityRequestForm({
  sent,
  message,
  sending,
  onMessageChange,
  onSubmit,
  onResetSent,
}: CommunityRequestFormProps) {
  return (
    <Card className="animate-slide-up stagger-1 flex flex-col gap-4 p-4">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-semibold">Запрос отправлен!</p>
            <p className="text-sm text-muted-foreground">
              Администратор рассмотрит ваше пожелание
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onResetSent}>
            Отправить ещё
          </Button>
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm font-semibold">Ваше пожелание</p>
            <p className="text-xs text-muted-foreground">
              Опишите что бы вы хотели видеть в сообществе
            </p>
          </div>
          <Textarea
            placeholder="Напишите ваш запрос..."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            maxLength={2000}
            rows={4}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {message.length} / 2000
            </span>
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={!message.trim() || sending}
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Отправка..." : "Отправить"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
