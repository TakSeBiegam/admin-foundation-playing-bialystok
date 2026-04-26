"use client";

import * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import MediaField from "@/app/components/MediaField";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import type { GalleryFolder } from "@/lib/types";
import { cn } from "@/lib/utils";

export const optionalUrlPattern = {
  value: /^(https?:\/\/.+)?$/,
  message: "Podaj poprawny URL",
} as const;

export const optionalUrlOrMediaPathPattern = {
  value: /^(https?:\/\/.+|\/.+)?$/,
  message: "Podaj poprawny URL lub ścieżkę lokalną",
} as const;

type AdminFormDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  contentClassName?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function AdminFormDialog({
  open,
  title,
  description,
  contentClassName,
  onClose,
  children,
}: AdminFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto border-white/10 bg-[#111111]",
          contentClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

type FormFieldProps = {
  label?: string;
  htmlFor?: string;
  error?: string;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
};

export function FormField({
  label,
  htmlFor,
  error,
  helpText,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {helpText ? (
        <p className="text-xs leading-relaxed text-white/45">{helpText}</p>
      ) : null}
      {error ? <p className="text-xs text-brand-red">{error}</p> : null}
    </div>
  );
}

export const FormSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-white/20 bg-[#2e2e2e] px-3 py-1 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-yellow",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

FormSelect.displayName = "FormSelect";

type FormActionsProps = {
  onCancel: () => void;
  submitLabel: string;
  cancelLabel?: string;
  className?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
};

export function FormActions({
  onCancel,
  submitLabel,
  cancelLabel = "Anuluj",
  className,
  isSubmitting = false,
  disabled = false,
}: FormActionsProps) {
  return (
    <div className={cn("flex justify-end gap-3 pt-2", className)}>
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isSubmitting || disabled}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        variant="default"
        disabled={isSubmitting || disabled}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

type FormStaticValueProps = {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
};

export function FormStaticValue({
  label,
  value,
  className,
  valueClassName,
}: FormStaticValueProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      <div
        className={cn(
          "flex h-10 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/70",
          valueClassName,
        )}
      >
        {value}
      </div>
    </div>
  );
}

export const CheckboxField = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
    label: string;
  }
>(({ label, className, ...props }, ref) => {
  return (
    <label
      className={cn("flex items-center gap-2 text-sm text-white/80", className)}
    >
      <input
        ref={ref}
        type="checkbox"
        className="h-4 w-4 rounded border-white/20 bg-[#2e2e2e]"
        {...props}
      />
      {label}
    </label>
  );
});

CheckboxField.displayName = "CheckboxField";

type FormMediaFieldProps = {
  registration: UseFormRegisterReturn;
  label: string;
  inputId: string;
  value: string;
  placeholder: string;
  folder: GalleryFolder;
  error?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

export function FormMediaField({
  registration,
  label,
  inputId,
  value,
  placeholder,
  folder,
  error,
  onChange,
  onClear,
}: FormMediaFieldProps) {
  return (
    <>
      <input type="hidden" {...registration} />
      <MediaField
        label={label}
        inputId={inputId}
        value={value}
        placeholder={placeholder}
        folder={folder}
        error={error}
        onChange={onChange}
        onClear={onClear}
      />
    </>
  );
}
