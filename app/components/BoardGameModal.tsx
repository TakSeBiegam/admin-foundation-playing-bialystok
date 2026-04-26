"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  AdminFormDialog,
  FormActions,
  FormField,
  FormMediaField,
  FormSelect,
  optionalUrlOrMediaPathPattern,
} from "@/app/components/forms/FormPrimitives";
import AutocompleteInput, {
  type AutocompleteOption,
} from "@/app/components/forms/AutocompleteInput";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  boardGameDifficultyOptions,
  getBoardGameDifficultyMeta,
  normalizeBoardGameDifficultyValue,
} from "@/lib/board-game-difficulty";
import type { BoardGame } from "@/lib/types";

export type BoardGameFormValues = {
  title: string;
  description: string;
  playerBucket: string;
  playTime: string;
  category: string;
  difficulty: string;
  imageUrl: string;
  imageAlt: string;
  order: number;
};

interface BoardGameModalProps {
  open: boolean;
  game?: BoardGame | null;
  categorySuggestions?: string[];
  onSave: (data: BoardGameFormValues) => void;
  onClose: () => void;
}

const defaultValues: BoardGameFormValues = {
  title: "",
  description: "",
  playerBucket: "2-4",
  playTime: "",
  category: "",
  difficulty: "",
  imageUrl: "",
  imageAlt: "",
  order: 0,
};

const playTimeSuggestions: AutocompleteOption[] = [
  { value: "15-20 min", label: "15-20 min" },
  { value: "20-30 min", label: "20-30 min" },
  { value: "30-45 min", label: "30-45 min" },
  { value: "45-60 min", label: "45-60 min" },
  { value: "60-90 min", label: "60-90 min" },
  { value: "90-120 min", label: "90-120 min" },
  { value: "2-3 h", label: "2-3 h" },
  { value: "3 h+", label: "3 h+" },
];

export default function BoardGameModal({
  open,
  game,
  categorySuggestions = [],
  onSave,
  onClose,
}: BoardGameModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BoardGameFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (game) {
      reset({
        title: game.title,
        description: game.description,
        playerBucket: game.playerBucket,
        playTime: game.playTime ?? "",
        category: game.category ?? "",
        difficulty: normalizeBoardGameDifficultyValue(game.difficulty) ?? "",
        imageUrl: game.imageUrl ?? "",
        imageAlt: game.imageAlt ?? "",
        order: game.order,
      });
      return;
    }

    reset(defaultValues);
  }, [game, open, reset]);

  const imageUrl = watch("imageUrl");
  const playTimeValue = watch("playTime");
  const categoryValue = watch("category");
  const selectedDifficulty = watch("difficulty");
  const selectedDifficultyMeta = getBoardGameDifficultyMeta(selectedDifficulty);
  const categoryOptions = useMemo(
    () =>
      [...categorySuggestions]
        .sort((left, right) => left.localeCompare(right, "pl"))
        .map(
          (category) =>
            ({
              value: category,
              label: category,
            }) satisfies AutocompleteOption,
        ),
    [categorySuggestions],
  );

  return (
    <AdminFormDialog
      open={open}
      onClose={onClose}
      title={game ? "Edytuj planszówkę" : "Nowa planszówka"}
      contentClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSave)} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr_0.6fr]">
          <FormField
            label="Tytuł *"
            htmlFor="boardgame-title"
            error={errors.title?.message}
          >
            <Input
              id="boardgame-title"
              placeholder="np. Azul"
              {...register("title", {
                required: "Tytuł jest wymagany",
                minLength: { value: 2, message: "Min. 2 znaki" },
              })}
            />
          </FormField>

          <FormField
            label="Zakres graczy *"
            htmlFor="boardgame-player-bucket"
            error={errors.playerBucket?.message}
          >
            <FormSelect
              id="boardgame-player-bucket"
              {...register("playerBucket", {
                required: "Zakres graczy jest wymagany",
              })}
            >
              <option value="1-2">1-2</option>
              <option value="2-4">2-4</option>
              <option value="4+">4+</option>
            </FormSelect>
          </FormField>

          <FormField label="Kolejność" htmlFor="boardgame-order">
            <Input
              id="boardgame-order"
              type="number"
              placeholder="0"
              {...register("order", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <FormField
          label="Krótki opis *"
          htmlFor="boardgame-description"
          error={errors.description?.message}
        >
          <Textarea
            id="boardgame-description"
            rows={4}
            placeholder="Krótki opis wyświetlany na kafelku po najechaniu"
            {...register("description", {
              required: "Opis jest wymagany",
              minLength: { value: 12, message: "Dodaj trochę więcej treści" },
            })}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <FormField
            label="Czas gry"
            htmlFor="boardgame-playtime"
            helpText="Wybierz gotowy zakres albo wpisz wlasny."
          >
            <>
              <input type="hidden" {...register("playTime")} />
              <AutocompleteInput
                id="boardgame-playtime"
                value={playTimeValue}
                options={playTimeSuggestions}
                placeholder="np. 30-45 min"
                emptyText="Brak podpowiedzi czasu gry."
                onChange={(value) =>
                  setValue("playTime", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </>
          </FormField>

          <FormField
            label="Kategoria"
            htmlFor="boardgame-category"
            helpText="System podpowiada kategorie juz obecne w katalogu."
          >
            <>
              <input type="hidden" {...register("category")} />
              <AutocompleteInput
                id="boardgame-category"
                value={categoryValue}
                options={categoryOptions}
                placeholder="np. Rodzinna"
                emptyText="Brak podobnych kategorii. Mozesz wpisac nowa."
                onChange={(value) =>
                  setValue("category", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </>
          </FormField>

          <FormField
            label="Poziom trudności"
            htmlFor="boardgame-difficulty"
            helpText={
              selectedDifficultyMeta?.description ??
              "Opcjonalna klasyfikacja poziomu wejscia."
            }
          >
            <FormSelect id="boardgame-difficulty" {...register("difficulty")}>
              <option value="">Brak</option>
              {boardGameDifficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormMediaField
            registration={register("imageUrl", {
              pattern: optionalUrlOrMediaPathPattern,
            })}
            label="Zdjęcie planszówki"
            inputId="boardgame-image-url"
            value={imageUrl}
            placeholder="https://... albo wybór z galerii"
            folder="board-games"
            error={errors.imageUrl?.message}
            onChange={(value) =>
              setValue("imageUrl", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onClear={() =>
              setValue("imageAlt", "", {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          <FormField label="Alt zdjęcia" htmlFor="boardgame-image-alt">
            <Input
              id="boardgame-image-alt"
              placeholder="Opis zdjęcia"
              {...register("imageAlt")}
            />
          </FormField>
        </div>

        <FormActions
          onCancel={onClose}
          submitLabel={game ? "Zapisz zmiany" : "Dodaj planszówkę"}
        />
      </form>
    </AdminFormDialog>
  );
}
