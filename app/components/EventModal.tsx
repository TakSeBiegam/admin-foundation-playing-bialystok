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
    setValue,
    watch,
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

  const imageUrl = watch("imageUrl");

  return (
    <AdminFormDialog
      open={open}
      onClose={onClose}
      title={event ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
      contentClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          label="Tytuł *"
          htmlFor="ev-title"
          error={errors.title?.message}
        >
          <Input
            id="ev-title"
            placeholder="np. Planszówki Johnny'ego"
            {...register("title", { required: "Tytuł jest wymagany" })}
            aria-invalid={!!errors.title}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Data *"
            htmlFor="ev-date"
            error={errors.date?.message}
          >
            <Input
              id="ev-date"
              type="date"
              {...register("date", { required: "Data jest wymagana" })}
              aria-invalid={!!errors.date}
            />
          </FormField>
          <FormField label="Godzina" htmlFor="ev-time">
            <Input id="ev-time" placeholder="np. 18:00" {...register("time")} />
          </FormField>
        </div>

        <FormField label="Lokalizacja" htmlFor="ev-location">
          <Input
            id="ev-location"
            placeholder="np. Kawiarnia META, ul. Lipowa 1"
            {...register("location")}
          />
        </FormField>

        <FormField label="Opis" htmlFor="ev-description">
          <Textarea
            id="ev-description"
            rows={4}
            placeholder="Opis wydarzenia..."
            {...register("description")}
          />
        </FormField>

        <FormField
          label="Link do Facebooka"
          htmlFor="ev-facebook"
          error={errors.facebookUrl?.message}
        >
          <Input
            id="ev-facebook"
            type="url"
            placeholder="https://facebook.com/events/..."
            {...register("facebookUrl", {
              pattern: optionalUrlPattern,
            })}
          />
        </FormField>

        <FormMediaField
          registration={register("imageUrl", {
            pattern: optionalUrlOrMediaPathPattern,
          })}
          label="Zdjęcie wydarzenia"
          inputId="ev-image"
          value={imageUrl}
          placeholder="https://... albo wybór z galerii"
          folder="events"
          error={errors.imageUrl?.message}
          onChange={(value) =>
            setValue("imageUrl", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />

        <FormActions
          onCancel={onClose}
          submitLabel={event ? "Zapisz zmiany" : "Dodaj"}
        />
      </form>
    </AdminFormDialog>
  );
}
