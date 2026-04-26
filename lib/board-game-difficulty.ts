export type BoardGameDifficultyValue =
  | "IMPREZOWA"
  | "LATWA"
  | "SREDNI"
  | "EKSPERCKA";

type BoardGameDifficultyOption = {
  value: BoardGameDifficultyValue;
  label: string;
  description: string;
  aliases: string[];
};

export const boardGameDifficultyOptions: BoardGameDifficultyOption[] = [
  {
    value: "IMPREZOWA",
    label: "Imprezowa",
    description:
      "Zasady w 15 minut, gra do godziny. Idealna także dla osób spoza hobby.",
    aliases: ["imprezowy"],
  },
  {
    value: "LATWA",
    label: "Łatwa",
    description:
      "Zasady do 30 minut, gra do 2 godzin. Wysoka regrywalność i niski próg wejścia.",
    aliases: ["łatwy", "latwa", "latwy"],
  },
  {
    value: "SREDNI",
    label: "Średni",
    description:
      "Tłumaczenie do godziny, rozgrywka na cały wieczór. Większe wyzwanie strategiczne.",
    aliases: [
      "średnia",
      "srednia",
      "sredni",
      "strategiczny",
      "strategiczna",
    ],
  },
  {
    value: "EKSPERCKA",
    label: "Ekspercka",
    description:
      "Instrukcja jak książka, partia na cały dzień lub dłużej. Bardzo wysoki próg wejścia.",
    aliases: ["ekspercki"],
  },
];

const optionByValue = new Map<
  BoardGameDifficultyValue,
  BoardGameDifficultyOption
>(boardGameDifficultyOptions.map((option) => [option.value, option]));

const optionByAlias = new Map<string, BoardGameDifficultyOption>();
const labelOrder = new Map<string, number>();

for (const [index, option] of boardGameDifficultyOptions.entries()) {
  optionByAlias.set(option.value.toLowerCase(), option);
  optionByAlias.set(option.label.toLowerCase(), option);
  labelOrder.set(option.label, index);

  for (const alias of option.aliases) {
    optionByAlias.set(alias.toLowerCase(), option);
  }
}

export function normalizeBoardGameDifficultyValue(
  value?: string | null,
): BoardGameDifficultyValue | undefined {
  const normalizedValue = value?.trim().toLowerCase();
  if (!normalizedValue) {
    return undefined;
  }

  return optionByAlias.get(normalizedValue)?.value;
}

export function getBoardGameDifficultyMeta(value?: string | null) {
  const normalizedValue = normalizeBoardGameDifficultyValue(value);
  if (!normalizedValue) {
    return undefined;
  }

  return optionByValue.get(normalizedValue);
}

export function getBoardGameDifficultyLabel(value?: string | null) {
  return getBoardGameDifficultyMeta(value)?.label ?? value?.trim() ?? undefined;
}

export function compareBoardGameDifficultyLabels(left: string, right: string) {
  const leftLabel = getBoardGameDifficultyLabel(left) ?? left.trim();
  const rightLabel = getBoardGameDifficultyLabel(right) ?? right.trim();
  const leftIndex = labelOrder.get(leftLabel);
  const rightIndex = labelOrder.get(rightLabel);

  if (leftIndex === undefined && rightIndex === undefined) {
    return leftLabel.localeCompare(rightLabel, "pl");
  }
  if (leftIndex === undefined) {
    return 1;
  }
  if (rightIndex === undefined) {
    return -1;
  }

  return leftIndex - rightIndex;
}