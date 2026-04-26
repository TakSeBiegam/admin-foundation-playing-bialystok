"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  AdminFormDialog,
  FormActions,
  FormField,
  FormMediaField,
  optionalUrlOrMediaPathPattern,
  optionalUrlPattern,
} from "@/app/components/forms/FormPrimitives";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import type { Partner } from "@/lib/types";

export type PartnerFormValues = {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  description: string;
};

interface PartnerModalProps {
  open: boolean;
  partner?: Partner | null;
  onSave: (data: PartnerFormValues) => void;
  onClose: () => void;
}

export default function PartnerModal({
  open,
  partner,
  onSave,
  onClose,
}: PartnerModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PartnerFormValues>({
    defaultValues: { name: "", logoUrl: "", websiteUrl: "", description: "" },
  });

  useEffect(() => {
    if (partner) {
      reset({
        name: partner.name,
        logoUrl: partner.logoUrl ?? "",
        websiteUrl: partner.websiteUrl ?? "",
        description: partner.description ?? "",
      });
    } else {
      reset({ name: "", logoUrl: "", websiteUrl: "", description: "" });
    }
  }, [partner, open, reset]);

  const logoUrl = watch("logoUrl");

  return (
    <AdminFormDialog
      open={open}
      onClose={onClose}
      title={partner ? "Edytuj partnera" : "Nowy partner"}
      contentClassName="max-w-md"
    >
      <form onSubmit={handleSubmit(onSave)} className="space-y-4 pt-2">
        <FormField
          label="Nazwa *"
          htmlFor="pt-name"
          error={errors.name?.message}
        >
          <Input
            id="pt-name"
            placeholder="np. Kawiarnia META"
            {...register("name", { required: "Nazwa jest wymagana" })}
            aria-invalid={!!errors.name}
          />
        </FormField>

        <FormField
          label="Strona internetowa"
          htmlFor="pt-website"
          error={errors.websiteUrl?.message}
        >
          <Input
            id="pt-website"
            type="url"
            placeholder="https://example.com"
            {...register("websiteUrl", {
              pattern: {
                ...optionalUrlPattern,
                message: "Podaj poprawny URL lub zostaw puste",
              },
            })}
          />
        </FormField>

        <FormMediaField
          registration={register("logoUrl", {
            pattern: optionalUrlOrMediaPathPattern,
          })}
          label="Logo partnera"
          inputId="pt-logo"
          value={logoUrl}
          placeholder="https://... albo wybór z galerii"
          folder="partners"
          error={errors.logoUrl?.message}
          onChange={(value) =>
            setValue("logoUrl", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />

        <FormField label="Opis (opcjonalny)" htmlFor="pt-desc">
          <Textarea
            id="pt-desc"
            rows={3}
            placeholder="Krótki opis partnera..."
            {...register("description")}
          />
        </FormField>

        <FormActions
          onCancel={onClose}
          submitLabel={partner ? "Zapisz zmiany" : "Dodaj partnera"}
        />
      </form>
    </AdminFormDialog>
  );
}
