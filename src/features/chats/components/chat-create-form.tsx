import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ChatCreateFormProps {
  showForm: boolean;
  title: string;
  url: string;
  description: string;
  saving: boolean;
  onTitleChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onOpen: () => void;
  onCancel: () => void;
}

export function ChatCreateForm({
  showForm,
  title,
  url,
  description,
  saving,
  onTitleChange,
  onUrlChange,
  onDescriptionChange,
  onSubmit,
  onOpen,
  onCancel,
}: ChatCreateFormProps) {
  if (!showForm) {
    return (
      <Button variant="outline" className="w-full" onClick={onOpen}>
        <Plus className="mr-2 h-4 w-4" />
        Добавить чат
      </Button>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <p className="text-sm font-semibold">Новый чат/канал</p>
      <Input
        placeholder="Название"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        maxLength={200}
      />
      <Input
        placeholder="Ссылка (https://t.me/...)"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        maxLength={500}
      />
      <Textarea
        placeholder="Описание (необязательно)"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        maxLength={500}
        rows={2}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!title.trim() || !url.trim() || saving}
        >
          {saving ? "Сохранение..." : "Добавить"}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </Card>
  );
}
