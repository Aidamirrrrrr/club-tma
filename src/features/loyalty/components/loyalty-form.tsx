import { Camera, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LoyaltyStatus } from "@/constants/domain";
import type { useLoyaltyForm } from "@/features/loyalty/hooks/use-loyalty-form";

type ImageField = "coverUrl" | "logoUrl" | "qrUrl";

type LoyaltyFormState = ReturnType<typeof useLoyaltyForm>;

interface ImagePickerProps {
  field: ImageField;
  label: string;
  value: string;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  square?: boolean;
}

function ImagePicker({
  field,
  label,
  value,
  uploading,
  onUpload,
  onReset,
  square,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sizeClass = square ? "h-40 w-40" : "h-40 w-full";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`upload-${field}`} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={`upload-${field}`}
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUpload}
      />
      {value ? (
        <div className={`relative overflow-hidden rounded-xl ${sizeClass}`}>
          <Image
            src={value}
            alt={label}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-3.5 w-3.5" />
              Заменить
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onReset}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border transition-colors hover:bg-muted/50 ${sizeClass}`}
        >
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          ) : (
            <>
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Загрузить</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

interface LoyaltyFormProps {
  state: LoyaltyFormState;
  submitLabel: string;
}

/** Общая форма создания/редактирования карточки лояльности. */
export function LoyaltyForm({ state, submitLabel }: LoyaltyFormProps) {
  const {
    form,
    setForm,
    saving,
    uploadingField,
    handleChange,
    uploadImage,
    resetImage,
    handleSubmit,
  } = state;

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-slide-up stagger-1 flex flex-col gap-4"
    >
      <FormField
        label="Название *"
        name="title"
        id="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Например, Ресторан Peach"
        required
      />
      <FormField
        label="Текст скидки"
        name="discountLabel"
        id="discountLabel"
        value={form.discountLabel}
        onChange={handleChange}
        placeholder="СКИДКА 10%"
      />

      <ImagePicker
        field="coverUrl"
        label="Фото"
        value={form.coverUrl}
        uploading={uploadingField === "coverUrl"}
        onUpload={uploadImage("coverUrl")}
        onReset={() => resetImage("coverUrl")}
      />
      <ImagePicker
        field="logoUrl"
        label="Логотип партнёра"
        value={form.logoUrl}
        uploading={uploadingField === "logoUrl"}
        onUpload={uploadImage("logoUrl")}
        onReset={() => resetImage("logoUrl")}
        square
      />
      <ImagePicker
        field="qrUrl"
        label="QR-код"
        value={form.qrUrl}
        uploading={uploadingField === "qrUrl"}
        onUpload={uploadImage("qrUrl")}
        onReset={() => resetImage("qrUrl")}
        square
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Статус</Label>
        <Select
          value={form.status}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, status: value as LoyaltyStatus }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Активна</SelectItem>
            <SelectItem value="hidden">Скрыта</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Сохранение..." : submitLabel}
      </Button>
    </form>
  );
}
