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
import type { Event } from "@/lib/types";

export type EventFormValues = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  facebookUrl: string;
  imageUrl: string;
};

interface EventModalProps {
  open: boolean;
  event?: Event | null;
  onSave: (data: EventFormValues) => void;
  onClose: () => void;
}

export default function EventModal({
  open,
  event,
  onSave,
  onClose,
}: EventModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      facebookUrl: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description ?? "",
        date: event.date,
        time: event.time ?? "",
        location: event.location ?? "",
        facebookUrl: event.facebookUrl ?? "",
        imageUrl: event.imageUrl ?? "",
      });
    } else {
      reset({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        facebookUrl: "",
        imageUrl: "",
      });
    }
  }, [event, open, reset]);

  const onSubmit = (data: EventFormValues) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-[#111111] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {event ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Tytuł *</Label>
            <Input
              id="ev-title"
              placeholder="np. Planszówki Johnny'ego"
              {...register("title", { required: "Tytuł jest wymagany" })}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-[#F13738] text-xs">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-date">Data *</Label>
              <Input
                id="ev-date"
                type="date"
                {...register("date", { required: "Data jest wymagana" })}
                aria-invalid={!!errors.date}
              />
              {errors.date && (
                <p className="text-[#F13738] text-xs">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-time">Godzina</Label>
              <Input
                id="ev-time"
                placeholder="np. 18:00"
                {...register("time")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-location">Lokalizacja</Label>
            <Input
              id="ev-location"
              placeholder="np. Kawiarnia META, ul. Lipowa 1"
              {...register("location")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-description">Opis</Label>
            <Textarea
              id="ev-description"
              rows={4}
              placeholder="Opis wydarzenia..."
              {...register("description")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-facebook">Link do Facebooka</Label>
            <Input
              id="ev-facebook"
              type="url"
              placeholder="https://facebook.com/events/..."
              {...register("facebookUrl", {
                pattern: {
                  value: /^(https?:\/\/.+)?$/,
                  message: "Podaj poprawny URL",
                },
              })}
            />
            {errors.facebookUrl && (
              <p className="text-[#F13738] text-xs">
                {errors.facebookUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-image">URL zdjęcia (opcjonalne)</Label>
            <Input
              id="ev-image"
              type="url"
              placeholder="https://..."
              {...register("imageUrl", {
                pattern: {
                  value: /^(https?:\/\/.+)?$/,
                  message: "Podaj poprawny URL lub zostaw puste",
                },
              })}
            />
            {errors.imageUrl && (
              <p className="text-[#F13738] text-xs">
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" variant="default">
              {event ? "Zapisz zmiany" : "Dodaj"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
