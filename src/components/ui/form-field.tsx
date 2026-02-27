import type * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function FormField({
  label,
  className,
  ...props
}: React.ComponentProps<"input"> & { label: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={props.id}>{label}</Label>
      <Input {...props} />
    </div>
  );
}

function FormTextarea({
  label,
  className,
  ...props
}: React.ComponentProps<"textarea"> & { label: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={props.id}>{label}</Label>
      <Textarea {...props} />
    </div>
  );
}

export { FormField, FormTextarea };
