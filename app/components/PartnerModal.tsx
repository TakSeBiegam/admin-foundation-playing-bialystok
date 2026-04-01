"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-[#111111] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {partner ? "Edytuj partnera" : "Nowy partner"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="pt-name">Nazwa *</Label>
            <Input
              id="pt-name"
              placeholder="np. Kawiarnia META"
              {...register("name", { required: "Nazwa jest wymagana" })}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-brand-red text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pt-website">Strona internetowa</Label>
            <Input
              id="pt-website"
              type="url"
              placeholder="https://example.com"
              {...register("websiteUrl", {
                pattern: {
                  value: /^(https?:\/\/.+)?$/,
                  message: "Podaj poprawny URL lub zostaw puste",
                },
              })}
            />
            {errors.websiteUrl && (
              <p className="text-brand-red text-xs">
                {errors.websiteUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pt-logo">URL logo (opcjonalne)</Label>
            <Input
              id="pt-logo"
              type="url"
              placeholder="https://..."
              {...register("logoUrl", {
                pattern: {
                  value: /^(https?:\/\/.+)?$/,
                  message: "Podaj poprawny URL lub zostaw puste",
                },
              })}
            />
            {errors.logoUrl && (
              <p className="text-brand-red text-xs">{errors.logoUrl.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pt-desc">Opis (opcjonalny)</Label>
            <Textarea
              id="pt-desc"
              rows={3}
              placeholder="Krótki opis partnera..."
              {...register("description")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" variant="default">
              {partner ? "Zapisz zmiany" : "Dodaj partnera"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
