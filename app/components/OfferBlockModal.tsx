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
import type { OfferBlock } from "@/lib/types";

export type OfferBlockFormValues = {
  section: string;
  blockType: string;
  badge: string;
  title: string;
  subtitle: string;
  content: string;
  itemsText: string;
  highlight: string;
  imageUrl: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  isFeatured: boolean;
  order: number;
};

interface OfferBlockModalProps {
  open: boolean;
  block?: OfferBlock | null;
  onSave: (data: OfferBlockFormValues) => void;
  onClose: () => void;
}

const defaultValues: OfferBlockFormValues = {
  section: "services",
  blockType: "service",
  badge: "",
  title: "",
  subtitle: "",
  content: "",
  itemsText: "",
  highlight: "",
  imageUrl: "",
  imageAlt: "",
  ctaLabel: "",
  ctaHref: "",
  isFeatured: false,
  order: 0,
};

export default function OfferBlockModal({
  open,
  block,
  onSave,
  onClose,
}: OfferBlockModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OfferBlockFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (block) {
      reset({
        section: block.section,
        blockType: block.blockType,
        badge: block.badge ?? "",
        title: block.title ?? "",
        subtitle: block.subtitle ?? "",
        content: block.content ?? "",
        itemsText: (block.items ?? []).join("\n"),
        highlight: block.highlight ?? "",
        imageUrl: block.imageUrl ?? "",
        imageAlt: block.imageAlt ?? "",
        ctaLabel: block.ctaLabel ?? "",
        ctaHref: block.ctaHref ?? "",
        isFeatured: block.isFeatured,
        order: block.order,
      });
      return;
    }

    reset(defaultValues);
  }, [block, open, reset]);

  const onSubmit = (data: OfferBlockFormValues) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-[#111111]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {block ? "Edytuj blok oferty" : "Nowy blok oferty"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="offer-section">Sekcja *</Label>
              <Input
                id="offer-section"
                placeholder="np. services"
                {...register("section", {
                  required: "Sekcja jest wymagana",
                  minLength: { value: 2, message: "Min. 2 znaki" },
                })}
              />
              {errors.section ? (
                <p className="text-xs text-brand-red">{errors.section.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offer-type">Typ bloku *</Label>
              <Input
                id="offer-type"
                placeholder="np. service"
                {...register("blockType", {
                  required: "Typ bloku jest wymagany",
                  minLength: { value: 2, message: "Min. 2 znaki" },
                })}
              />
              {errors.blockType ? (
                <p className="text-xs text-brand-red">{errors.blockType.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offer-order">Kolejność</Label>
              <Input
                id="offer-order"
                type="number"
                placeholder="0"
                {...register("order", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-badge">Etykieta</Label>
            <Input
              id="offer-badge"
              placeholder="np. Szkolenia"
              {...register("badge")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-title">Tytuł</Label>
            <Input
              id="offer-title"
              placeholder="Tytuł modułu"
              {...register("title")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-subtitle">Podtytuł</Label>
            <Input
              id="offer-subtitle"
              placeholder="Krótki podtytuł"
              {...register("subtitle")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-content">Treść</Label>
            <Textarea
              id="offer-content"
              rows={4}
              placeholder="Opis modułu"
              {...register("content")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-items">
              Lista elementów (po jednym w linii)
            </Label>
            <Textarea
              id="offer-items"
              rows={5}
              placeholder={"Pozycja 1\nPozycja 2\nPozycja 3"}
              {...register("itemsText")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="offer-highlight">Wyróżniona informacja</Label>
            <Textarea
              id="offer-highlight"
              rows={3}
              placeholder="Kluczowy komunikat"
              {...register("highlight")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="offer-image-url">URL zdjęcia</Label>
              <Input
                id="offer-image-url"
                placeholder="https://..."
                {...register("imageUrl", {
                  pattern: {
                    value: /^(https?:\/\/.+|\/.+)?$/,
                    message: "Podaj poprawny URL lub ścieżkę lokalną",
                  },
                })}
              />
              {errors.imageUrl ? (
                <p className="text-xs text-brand-red">{errors.imageUrl.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offer-image-alt">Alt zdjęcia</Label>
              <Input
                id="offer-image-alt"
                placeholder="Opis zdjęcia"
                {...register("imageAlt")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="offer-cta-label">Etykieta CTA</Label>
              <Input
                id="offer-cta-label"
                placeholder="np. Umów konsultację"
                {...register("ctaLabel")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offer-cta-href">Link CTA</Label>
              <Input
                id="offer-cta-href"
                placeholder="np. /contact"
                {...register("ctaHref", {
                  pattern: {
                    value: /^(https?:\/\/.+|\/.+)?$/,
                    message: "Podaj poprawny URL lub ścieżkę lokalną",
                  },
                })}
              />
              {errors.ctaHref ? (
                <p className="text-xs text-brand-red">{errors.ctaHref.message}</p>
              ) : null}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-[#2e2e2e]"
              {...register("isFeatured")}
            />
            Wyróżnij ten blok
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" variant="default">
              {block ? "Zapisz zmiany" : "Dodaj blok"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
