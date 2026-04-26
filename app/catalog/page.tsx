"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Images,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import BoardGameModal, {
  type BoardGameFormValues,
} from "@/app/components/BoardGameModal";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import ToastContainer, { type ToastData } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { FormField, FormSelect } from "@/app/components/forms/FormPrimitives";
import {
  compareBoardGameDifficultyLabels,
  getBoardGameDifficultyLabel,
  normalizeBoardGameDifficultyValue,
} from "@/lib/board-game-difficulty";
import { gql } from "@/lib/graphql";
import type {
  BoardGame,
  BoardGameCatalogPageData,
  BoardGameSortMode,
} from "@/lib/types";

const PAGE_SIZE = 12;

const BOARD_GAMES_CATALOG_QUERY = `query BoardGamesCatalog($input: BoardGameCatalogInput) {
  boardGamesCatalog(input: $input) {
    items {
      id
      title
      description
      playerBucket
      playTime
      category
      difficulty
      imageUrl
      imageAlt
      order
      createdAt
      updatedAt
    }
    totalCount
    hasMore
    nextOffset
    categories
    difficulties
    catalogTotalCount
    catalogWithImagesCount
  }
}`;

const CREATE_BOARD_GAME = `mutation CreateBoardGame($input: CreateBoardGameInput!) {
  createBoardGame(input: $input) {
    id
  }
}`;

const UPDATE_BOARD_GAME = `mutation UpdateBoardGame($id: ID!, $input: UpdateBoardGameInput!) {
  updateBoardGame(id: $id, input: $input) {
    id
  }
}`;

const DELETE_BOARD_GAME = `mutation DeleteBoardGame($id: ID!) {
  deleteBoardGame(id: $id)
}`;

const sortOptions: Array<{ value: BoardGameSortMode; label: string }> = [
  { value: "ORDER", label: "Kolejność" },
  { value: "AZ", label: "A-Z" },
  { value: "PLAYERS", label: "Liczba graczy" },
];

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildInput(values: BoardGameFormValues, initialGame?: BoardGame | null) {
  const imageUrl = normalizeText(values.imageUrl);
  const imageAlt = normalizeText(values.imageAlt);

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    playerBucket: values.playerBucket,
    playTime: normalizeText(values.playTime),
    category: normalizeText(values.category),
    difficulty: normalizeBoardGameDifficultyValue(values.difficulty),
    imageUrl,
    imageAlt,
    clearImageUrl: initialGame && hasText(initialGame.imageUrl) && !imageUrl,
    clearImageAlt: initialGame && hasText(initialGame.imageAlt) && !imageAlt,
    order: Number.isFinite(values.order) ? values.order : 0,
  };
}

const emptyPage: BoardGameCatalogPageData = {
  items: [],
  totalCount: 0,
  hasMore: false,
  nextOffset: null,
  categories: [],
  difficulties: [],
  catalogTotalCount: 0,
  catalogWithImagesCount: 0,
};

export default function CatalogAdminPage() {
  const [page, setPage] = useState<BoardGameCatalogPageData>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [playerFilter, setPlayerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortMode, setSortMode] = useState<BoardGameSortMode>("ORDER");
  const [offset, setOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BoardGame | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardGame | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const deferredSearch = useDeferredValue(search.trim());
  const sortedCategories = useMemo(
    () =>
      [...page.categories].sort((left, right) =>
        left.localeCompare(right, "pl"),
      ),
    [page.categories],
  );

  const sortedDifficulties = useMemo(() => {
    return [...page.difficulties].sort(compareBoardGameDifficultyLabels);
  }, [page.difficulties]);

  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "success") => {
      setToasts((previous) => [...previous, { id: Date.now(), message, type }]);
    },
    [],
  );

  const removeToast = (id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const loadPage = useCallback(
    async (requestedOffset: number) => {
      try {
        const data = await gql<{ boardGamesCatalog: BoardGameCatalogPageData }>(
          BOARD_GAMES_CATALOG_QUERY,
          {
            input: {
              filter: {
                search: deferredSearch || undefined,
                playerBucket: playerFilter === "all" ? undefined : playerFilter,
                category: categoryFilter === "all" ? undefined : categoryFilter,
                difficulty:
                  difficultyFilter === "all" ? undefined : difficultyFilter,
              },
              sort: sortMode,
              limit: PAGE_SIZE,
              offset: requestedOffset,
            },
          },
        );

        const nextPage = data.boardGamesCatalog ?? emptyPage;

        if (
          requestedOffset > 0 &&
          nextPage.items.length === 0 &&
          nextPage.totalCount > 0
        ) {
          setOffset(Math.max(0, requestedOffset - PAGE_SIZE));
          return;
        }

        setPage(nextPage);
      } catch {
        addToast("Błąd podczas ładowania katalogu gier", "error");
        setPage(emptyPage);
      } finally {
        setLoading(false);
      }
    },
    [
      addToast,
      categoryFilter,
      deferredSearch,
      difficultyFilter,
      playerFilter,
      sortMode,
    ],
  );

  useEffect(() => {
    setOffset(0);
  }, [
    categoryFilter,
    deferredSearch,
    difficultyFilter,
    playerFilter,
    sortMode,
  ]);

  useEffect(() => {
    setLoading(true);
    void loadPage(offset);
  }, [loadPage, offset, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(page.totalCount / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (game: BoardGame) => {
    setEditTarget(game);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSave = async (values: BoardGameFormValues) => {
    const input = buildInput(values, editTarget);

    try {
      if (editTarget) {
        await gql(UPDATE_BOARD_GAME, { id: editTarget.id, input });
        addToast(`Zaktualizowano planszówkę: ${input.title}`);
      } else {
        await gql(CREATE_BOARD_GAME, { input });
        addToast(`Dodano planszówkę: ${input.title}`);
      }

      setRefreshKey((current) => current + 1);
      closeModal();
    } catch (error) {
      addToast((error as Error).message || "Błąd zapisu", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await gql(DELETE_BOARD_GAME, { id: deleteTarget.id });
      addToast(`Usunięto planszówkę: ${deleteTarget.title}`, "error");
      setRefreshKey((current) => current + 1);
    } catch (error) {
      addToast((error as Error).message || "Błąd usuwania", "error");
    }

    setDeleteTarget(null);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Katalog gier</h1>
            <p className="mt-1 text-sm text-white/50">
              {loading
                ? "Ładowanie..."
                : `${page.totalCount} dopasowanych pozycji w katalogu`}
            </p>
          </div>

          <Button onClick={openCreate} variant="default">
            <PlusCircle className="h-4 w-4" />
            Dodaj planszówkę
          </Button>
        </div>

        <div className="mb-6 rounded-lg border border-white/10 bg-[#121212] p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Szukaj po tytule"
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => {
                  const active = sortMode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSortMode(option.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Wszystkie", value: "all" },
                  { label: "1-2", value: "1-2" },
                  { label: "2-4", value: "2-4" },
                  { label: "4+", value: "4+" },
                ].map((filter) => {
                  const active = playerFilter === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setPlayerFilter(filter.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        {filter.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[440px]">
                <FormField label="Kategoria" htmlFor="catalog-category-filter">
                  <FormSelect
                    id="catalog-category-filter"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    <option value="all">Wszystkie kategorie</option>
                    {sortedCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField
                  label="Poziom trudnosci"
                  htmlFor="catalog-difficulty-filter"
                >
                  <FormSelect
                    id="catalog-difficulty-filter"
                    value={difficultyFilter}
                    onChange={(event) =>
                      setDifficultyFilter(event.target.value)
                    }
                  >
                    <option value="all">Wszystkie poziomy</option>
                    {sortedDifficulties.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white">
            <span className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Ładowanie katalogu...
          </div>
        ) : page.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 py-20 text-center text-white">
            <Gamepad2 className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="text-lg">Brak wyników dla aktualnych filtrów</p>
            <p className="mt-1 text-sm text-white/55">
              Zmień wyszukiwanie albo dodaj nową planszówkę do katalogu.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-[#1a1a1a] text-xs uppercase tracking-wide text-white/50">
                    <th className="px-4 py-3 text-left font-medium">Tytuł</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Zakres / kategoria
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">
                      Trudność / czas
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                      Media
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium xl:table-cell">
                      Kolejność
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Akcje</th>
                  </tr>
                </thead>

                <tbody>
                  {page.items.map((game, index) => (
                    <tr
                      key={game.id}
                      className={`border-b border-white/5 transition-colors hover:bg-white/2 ${
                        index % 2 === 0 ? "" : "bg-white/1"
                      }`}
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-white">{game.title}</p>
                        <p className="mt-1 max-w-110 line-clamp-2 text-xs leading-5 text-white/50">
                          {game.description}
                        </p>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-brand-yellow/25 bg-brand-yellow/10 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] text-brand-yellow">
                            {game.playerBucket}
                          </span>
                          {game.category ? (
                            <span className="text-xs text-white/65">
                              {game.category}
                            </span>
                          ) : (
                            <span className="text-xs text-white/30">
                              Bez kategorii
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="hidden px-4 py-3 align-top lg:table-cell">
                        <p className="text-white/75">
                          {getBoardGameDifficultyLabel(game.difficulty) ??
                            "Brak poziomu"}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {game.playTime ?? "Bez czasu gry"}
                        </p>
                      </td>

                      <td className="hidden px-4 py-3 align-top md:table-cell">
                        {game.imageUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/70">
                            <Images className="h-3.5 w-3.5 text-brand-yellow" />
                            Zdjęcie
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">
                            Brak zdjęcia
                          </span>
                        )}
                      </td>

                      <td className="hidden px-4 py-3 align-top text-white/65 xl:table-cell">
                        {game.order}
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(game)}
                            className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-brand-yellow/10 hover:text-brand-yellow"
                            title="Edytuj"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(game)}
                            className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-brand-red/10 hover:text-brand-red"
                            title="Usuń"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/55">
                Strona {Math.min(currentPage, totalPages)} z {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setOffset((current) => Math.max(0, current - PAGE_SIZE))
                  }
                  disabled={offset === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Poprzednia
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setOffset((current) => current + PAGE_SIZE)}
                  disabled={!page.hasMore}
                >
                  Następna
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        <BoardGameModal
          open={modalOpen}
          game={editTarget}
          categorySuggestions={sortedCategories}
          onSave={handleSave}
          onClose={closeModal}
        />

        <ConfirmDialog
          open={!!deleteTarget}
          title="Usunąć planszówkę?"
          description={`Ta operacja usunie z katalogu pozycję "${deleteTarget?.title ?? ""}".`}
          confirmLabel="Usuń"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </main>
    </div>
  );
}
