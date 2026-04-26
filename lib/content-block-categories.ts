import type { OfferBlock } from "@/lib/types";

export type ContentPageKey = "offer" | "about-us";

export const contentPageLabels: Record<ContentPageKey, string> = {
  offer: "Oferta",
  "about-us": "O nas",
};

export type OfferBlockFormField =
  | "section"
  | "blockType"
  | "badge"
  | "title"
  | "subtitle"
  | "content"
  | "itemsText"
  | "highlight"
  | "image"
  | "imageAlt"
  | "ctaLabel"
  | "ctaHref"
  | "isFeatured"
  | "order";

export interface OfferBlockFieldMeta {
  label: string;
  placeholder?: string;
  helpText?: string;
  rows?: number;
}

export interface BlockCategoryPreview {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  ctaLabel?: string;
  accentClassName: string;
}

export interface BlockCategoryDefinition {
  key: string;
  label: string;
  description: string;
  defaultSection: string;
  defaultBlockType: string;
  pageDefaults?: Partial<Record<ContentPageKey, { section: string; blockType: string }>>;
  pageVisibleFields?: Partial<Record<ContentPageKey, OfferBlockFormField[]>>;
  matchSections?: string[];
  matchBlockTypes?: string[];
  suggestedPageKeys?: ContentPageKey[];
  visibleFields: OfferBlockFormField[];
  fieldMeta?: Partial<Record<OfferBlockFormField, OfferBlockFieldMeta>>;
  preview: BlockCategoryPreview;
}

const defaultBlockFieldMeta: Record<OfferBlockFormField, OfferBlockFieldMeta> = {
  section: {
    label: "Sekcja",
    placeholder: "Np. hero",
  },
  blockType: {
    label: "Typ bloku",
    placeholder: "Np. intro",
  },
  badge: {
    label: "Badge",
    placeholder: "Np. Gramy razem",
  },
  title: {
    label: "Tytul",
    placeholder: "Tytul sekcji",
  },
  subtitle: {
    label: "Podtytul",
    placeholder: "Krotkie doprecyzowanie tresci",
  },
  content: {
    label: "Opis",
    placeholder: "Glowny opis bloku",
    rows: 5,
  },
  itemsText: {
    label: "Elementy listy",
    placeholder: "Kazdy element w nowej linii",
    rows: 6,
  },
  highlight: {
    label: "Wyrzutnia tekstu",
    placeholder: "Krotki mocny akcent",
  },
  image: {
    label: "Grafika",
  },
  imageAlt: {
    label: "ALT grafiki",
    placeholder: "Opis alternatywny obrazu",
  },
  ctaLabel: {
    label: "Etykieta CTA",
    placeholder: "Np. Zobacz wiecej",
  },
  ctaHref: {
    label: "Link CTA",
    placeholder: "/kontakt lub https://...",
  },
  isFeatured: {
    label: "Wyróżniony blok",
  },
  order: {
    label: "Kolejnosc",
    placeholder: "0",
  },
};

export const blockCategoryDefinitions: BlockCategoryDefinition[] = [
  {
    key: "hero",
    label: "Hero / intro",
    description: "Najmocniejszy blok otwierajacy strone, zwykle z CTA i grafika.",
    defaultSection: "hero",
    defaultBlockType: "intro",
    pageDefaults: {
      offer: { section: "hero", blockType: "intro" },
      "about-us": { section: "hero", blockType: "hero" },
    },
    matchSections: ["hero", "about-us"],
    matchBlockTypes: ["intro", "hero"],
    suggestedPageKeys: ["offer", "about-us"],
    pageVisibleFields: {
      "about-us": ["title", "content", "highlight", "order"],
    },
    visibleFields: [
      "badge",
      "title",
      "subtitle",
      "content",
      "itemsText",
      "highlight",
      "image",
      "imageAlt",
      "ctaLabel",
      "ctaHref",
      "isFeatured",
      "order",
    ],
    preview: {
      eyebrow: "Sekcja otwarcia",
      title: "Pokaz klimat marki i od razu skieruj do akcji",
      description: "Hero dobrze laczy naglowek, argument i przycisk. To blok, ktory ma ustawic ton calej podstrony.",
      bullets: ["mocny tytul", "krotkie wsparcie", "jeden wyrazny CTA"],
      ctaLabel: "Przejdz dalej",
      accentClassName: "from-amber-400/30 via-orange-400/20 to-red-500/30",
    },
  },
  {
    key: "stat",
    label: "Statystyka / liczba",
    description: "Krotki blok z liczba, wynikiem albo jednym faktem o fundacji.",
    defaultSection: "about-us",
    defaultBlockType: "stat",
    matchSections: ["about-us", "stats", "stat"],
    matchBlockTypes: ["stat"],
    suggestedPageKeys: ["about-us"],
    visibleFields: ["title", "content", "order"],
    preview: {
      eyebrow: "Fakt w jednym kadrze",
      title: "1500+ godzin wspolnego grania",
      description: "Uzywaj, kiedy jedna liczba lub krotki fakt ma wybrzmiec bez dodatkowych ozdobnikow.",
      accentClassName: "from-emerald-400/25 via-teal-400/15 to-cyan-400/25",
    },
  },
  {
    key: "service",
    label: "Karta uslugi",
    description: "Sekcja z opisem konkretnej uslugi, warsztatu lub aktywnosci.",
    defaultSection: "services",
    defaultBlockType: "service",
    matchSections: ["services", "service"],
    matchBlockTypes: ["service"],
    suggestedPageKeys: ["offer", "about-us"],
    visibleFields: [
      "badge",
      "title",
      "subtitle",
      "content",
      "itemsText",
      "highlight",
      "image",
      "imageAlt",
      "isFeatured",
      "order",
    ],
    preview: {
      eyebrow: "Opis uslugi",
      title: "Warsztaty, animacje lub spotkania prowadzone przez zespol",
      description: "Dobrze sprawdza sie przy bardziej opisowych blokach z lista korzysci albo przebiegu.",
      bullets: ["dla szkol", "dla firm", "dla lokalnych spolecznosci"],
      accentClassName: "from-rose-400/25 via-red-500/10 to-orange-400/25",
    },
  },
  {
    key: "benefits",
    label: "Korzyści / atuty",
    description: "Lista powodow, dla ktorych warto wybrac dana oferte albo inicjatywe.",
    defaultSection: "benefits",
    defaultBlockType: "benefit",
    matchSections: ["benefits", "benefit"],
    matchBlockTypes: ["benefit"],
    suggestedPageKeys: ["offer", "about-us"],
    visibleFields: ["badge", "title", "content", "itemsText", "highlight", "isFeatured", "order"],
    preview: {
      eyebrow: "Mocne strony",
      title: "Pokaz konkretnie, co odbiorca zyskuje",
      description: "Najlepsze do jasnej listy przewag, benefitow albo efektow wspolpracy.",
      bullets: ["integracja", "rozwoj kompetencji", "bezpieczny format"],
      accentClassName: "from-sky-400/25 via-blue-500/10 to-indigo-400/25",
    },
  },
  {
    key: "scope",
    label: "Zakres / co zawiera",
    description: "Lista elementow wchodzacych w sklad oferty lub projektu.",
    defaultSection: "scope",
    defaultBlockType: "scope",
    matchSections: ["scope"],
    matchBlockTypes: ["scope"],
    suggestedPageKeys: ["offer", "about-us"],
    visibleFields: ["badge", "title", "content", "itemsText", "highlight", "order"],
    preview: {
      eyebrow: "Zakres dzialan",
      title: "Wymien precyzyjnie, co odbiorca dostaje",
      description: "Dobre miejsce na rozpisanie programu, etapow lub elementow wspolpracy.",
      bullets: ["prowadzenie", "materialy", "koordynacja"],
      accentClassName: "from-fuchsia-400/20 via-pink-400/10 to-rose-400/25",
    },
  },
  {
    key: "gallery",
    label: "Media / galeria",
    description: "Blok budujacy klimat za pomoca jednego mocnego obrazu lub galerii.",
    defaultSection: "gallery",
    defaultBlockType: "gallery",
    matchSections: ["gallery", "media"],
    matchBlockTypes: ["gallery", "image"],
    suggestedPageKeys: ["offer", "about-us"],
    visibleFields: ["badge", "title", "subtitle", "content", "image", "imageAlt", "order"],
    preview: {
      eyebrow: "Warstwa wizualna",
      title: "Wspieraj narracje materialem foto albo jednym kadrem",
      description: "Przydatne tam, gdzie obraz ma uzupelnic opowiesc i zwiekszyc wiarygodnosc tresci.",
      accentClassName: "from-stone-100/25 via-zinc-300/10 to-amber-100/25",
    },
  },
  {
    key: "partnership",
    label: "Wspolpraca / partnerstwo",
    description: "Sekcja dla sponsorow, partnerow i form wspolpracy z fundacja.",
    defaultSection: "partnership",
    defaultBlockType: "partnership",
    matchSections: ["partnership", "partners", "cooperation"],
    matchBlockTypes: ["partnership", "partnership-details"],
    suggestedPageKeys: ["offer", "about-us"],
    visibleFields: [
      "badge",
      "title",
      "content",
      "itemsText",
      "highlight",
      "ctaLabel",
      "ctaHref",
      "isFeatured",
      "order",
    ],
    preview: {
      eyebrow: "Sciezka wspolpracy",
      title: "Pokaz, jak partner moze wejsc w projekt",
      description: "Uzywaj przy ofertach sponsorskich, patronatach i wspolnych akcjach.",
      bullets: ["patronat", "wsparcie rzeczowe", "akcje specjalne"],
      ctaLabel: "Porozmawiajmy",
      accentClassName: "from-lime-300/25 via-emerald-300/10 to-yellow-300/25",
    },
  },
  {
    key: "process",
    label: "Proces / etapy",
    description: "Sekcja krok po kroku, tlumaczaca jak przebiega wspolpraca lub organizacja wydarzenia.",
    defaultSection: "process",
    defaultBlockType: "steps",
    matchSections: ["process", "steps"],
    matchBlockTypes: ["steps", "process"],
    suggestedPageKeys: ["offer", "about-us"],
    visibleFields: ["badge", "title", "content", "itemsText", "highlight", "order"],
    preview: {
      eyebrow: "Krok po kroku",
      title: "Ulatw odbiorcy zrozumienie calego procesu",
      description: "Dobrze dziala przy zamowieniach, wspolpracy albo opisie kolejnych etapow projektu.",
      bullets: ["kontakt", "ustalenie zakresu", "realizacja"],
      accentClassName: "from-cyan-300/25 via-sky-300/10 to-violet-300/20",
    },
  },
  {
    key: "faq",
    label: "FAQ / pytania",
    description: "Zbior najczestszych pytan z odpowiedziami lub listy rozwiewajacej watpliwosci.",
    defaultSection: "faq",
    defaultBlockType: "faq",
    matchSections: ["faq", "questions"],
    matchBlockTypes: ["faq"],
    suggestedPageKeys: ["offer", "about-us"],
    visibleFields: ["title", "content", "itemsText", "order"],
    preview: {
      eyebrow: "Pytania i odpowiedzi",
      title: "Zamknij obiekcje i doprecyzuj warunki",
      description: "Lista punktow sprawdza sie lepiej niz dlugi akapit, kiedy odpowiadasz na powtarzalne pytania.",
      bullets: ["dla kogo", "ile trwa", "jak sie zapisac"],
      accentClassName: "from-indigo-300/25 via-slate-300/10 to-cyan-300/20",
    },
  },
  {
    key: "cta",
    label: "CTA / domkniecie",
    description: "Finalny blok, ktory prowadzi uzytkownika do kontaktu, zapisu lub kolejnego kroku.",
    defaultSection: "cta",
    defaultBlockType: "cta",
    matchSections: ["cta", "about-us"],
    matchBlockTypes: ["cta"],
    suggestedPageKeys: ["offer", "about-us"],
    pageVisibleFields: {
      "about-us": ["title", "content", "ctaLabel", "ctaHref", "order"],
    },
    visibleFields: [
      "badge",
      "title",
      "subtitle",
      "content",
      "itemsText",
      "ctaLabel",
      "ctaHref",
      "order",
    ],
    preview: {
      eyebrow: "Domkniecie akcji",
      title: "Zostaw odbiorce z jednym czytelnym ruchem",
      description: "CTA ma kierowac dalej: do kontaktu, formularza, katalogu albo konkretnej oferty.",
      bullets: ["jeden priorytet", "krótka kopia", "czytelny link"],
      ctaLabel: "Skontaktuj sie",
      accentClassName: "from-amber-300/25 via-yellow-300/10 to-orange-300/25",
    },
  },
  {
    key: "custom",
    label: "Niestandardowy",
    description: "Pelna kontrola nad technicznym section/blockType, gdy standardowa kategoria nie pasuje.",
    defaultSection: "custom",
    defaultBlockType: "custom",
    suggestedPageKeys: ["offer", "about-us"],
    visibleFields: [
      "section",
      "blockType",
      "badge",
      "title",
      "subtitle",
      "content",
      "itemsText",
      "highlight",
      "image",
      "imageAlt",
      "ctaLabel",
      "ctaHref",
      "isFeatured",
      "order",
    ],
    preview: {
      eyebrow: "Tryb zaawansowany",
      title: "Gdy potrzebujesz wlasnej mapy pola do komponentu",
      description: "Wybierz tylko wtedy, gdy wiesz, ze sekcja i typ maja byc inne niz w gotowych kategoriach.",
      accentClassName: "from-slate-400/25 via-zinc-500/10 to-neutral-400/25",
    },
  },
];

const blockCategoryMap = new Map(
  blockCategoryDefinitions.map((definition) => [definition.key, definition]),
);

function normalizeBlockValue(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

export function getContentPageLabel(pageKey: ContentPageKey): string {
  return contentPageLabels[pageKey] ?? contentPageLabels.offer;
}

export function getBlockCategoryDefinition(
  key?: string | null,
): BlockCategoryDefinition {
  return blockCategoryMap.get(normalizeBlockValue(key)) ?? blockCategoryMap.get("custom")!;
}

export function getBlockFieldMeta(
  field: OfferBlockFormField,
  definition?: BlockCategoryDefinition,
): OfferBlockFieldMeta {
  return definition?.fieldMeta?.[field] ?? defaultBlockFieldMeta[field];
}

export function resolveBlockCategoryDefaults(
  definition: BlockCategoryDefinition,
  pageKey: ContentPageKey,
): { section: string; blockType: string } {
  return (
    definition.pageDefaults?.[pageKey] ?? {
      section: definition.defaultSection,
      blockType: definition.defaultBlockType,
    }
  );
}

export function resolveBlockVisibleFields(
  definition: BlockCategoryDefinition,
  pageKey: ContentPageKey,
): OfferBlockFormField[] {
  return definition.pageVisibleFields?.[pageKey] ?? definition.visibleFields;
}

export function findMatchingBlockCategory(
  pageKey: ContentPageKey,
  block?: Pick<OfferBlock, "categoryKey" | "section" | "blockType"> | null,
): BlockCategoryDefinition {
  const explicitCategory = getBlockCategoryDefinition(block?.categoryKey);
  if (block?.categoryKey && explicitCategory.key !== "custom") {
    return explicitCategory;
  }

  const normalizedSection = normalizeBlockValue(block?.section);
  const normalizedBlockType = normalizeBlockValue(block?.blockType);

  for (const definition of blockCategoryDefinitions) {
    if (definition.key === "custom") {
      continue;
    }

    const resolvedDefaults = resolveBlockCategoryDefaults(definition, pageKey);
    const sections = new Set(
      [resolvedDefaults.section, ...(definition.matchSections ?? [])]
        .map(normalizeBlockValue)
        .filter(Boolean),
    );
    const blockTypes = new Set(
      [resolvedDefaults.blockType, ...(definition.matchBlockTypes ?? [])]
        .map(normalizeBlockValue)
        .filter(Boolean),
    );

    if (
      normalizedBlockType &&
      blockTypes.has(normalizedBlockType) &&
      (!normalizedSection || sections.size === 0 || sections.has(normalizedSection))
    ) {
      return definition;
    }

    if (
      normalizedSection &&
      sections.has(normalizedSection) &&
      (!normalizedBlockType || blockTypes.size === 0 || blockTypes.has(normalizedBlockType))
    ) {
      return definition;
    }
  }

  return explicitCategory;
}