"use client";

import Image from "next/image";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Copy,
  FolderOpen,
  ImagePlus,
  LoaderCircle,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { Input } from "@/app/components/ui/input";
import { readGalleryJson, uploadGalleryFiles } from "@/lib/gallery-client";
import { GALLERY_FOLDER_OPTIONS, resolveMediaUrl } from "@/lib/media";
import type {
  GalleryAsset,
  GalleryFolder,
  GalleryListResponse,
} from "@/lib/types";

type GalleryBrowserProps = {
  initialFolder?: GalleryFolder;
  selectable?: boolean;
  selectedUrl?: string | null;
  onSelect?: (asset: GalleryAsset) => void;
  allowDelete?: boolean;
};

function formatUploadDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GalleryBrowser({
  initialFolder = "all",
  selectable = false,
  selectedUrl,
  onSelect,
  allowDelete = true,
}: GalleryBrowserProps) {
  const [folder, setFolder] = useState<GalleryFolder>(initialFolder);
  const [searchValue, setSearchValue] = useState("");
  const [items, setItems] = useState<GalleryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryAsset | null>(null);
  const deferredSearchValue = useDeferredValue(
    searchValue.trim().toLowerCase(),
  );

  const visibleItems = useMemo(() => {
    if (!deferredSearchValue) {
      return items;
    }

    return items.filter((item) =>
      item.pathname.toLowerCase().includes(deferredSearchValue),
    );
  }, [deferredSearchValue, items]);

  const loadAssets = useCallback(
    async (cursor?: string) => {
      const searchParams = new URLSearchParams({ folder, limit: "24" });
      if (cursor) {
        searchParams.set("cursor", cursor);
      }

      const response = await fetch(`/api/gallery?${searchParams.toString()}`, {
        cache: "no-store",
      });
      return readGalleryJson<GalleryListResponse>(response);
    },
    [folder],
  );

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    void loadAssets()
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setItems(payload.items ?? []);
        setHasMore(payload.hasMore);
        setNextCursor(payload.nextCursor);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nie udało się wczytać galerii.",
        );
        setItems([]);
        setHasMore(false);
        setNextCursor(undefined);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadAssets]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedAssets = await uploadGalleryFiles(
        Array.from(files),
        folder,
      );

      setItems((currentItems) => [
        ...uploadedAssets.reverse(),
        ...currentItems,
      ]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Nie udało się wgrać pliku.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!allowDelete || !deleteTarget) {
      return;
    }

    const asset = deleteTarget;
    setDeleteTarget(null);

    try {
      const response = await fetch(
        `/api/gallery?source=${encodeURIComponent(asset.url)}`,
        { method: "DELETE" },
      );

      await readGalleryJson<{ ok: boolean }>(response);
      setItems((currentItems) =>
        currentItems.filter((item) => item.pathname !== asset.pathname),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Nie udało się usunąć pliku.",
      );
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const payload = await loadAssets(nextCursor);
      setItems((currentItems) => [...currentItems, ...(payload.items ?? [])]);
      setHasMore(payload.hasMore);
      setNextCursor(payload.nextCursor);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nie udało się pobrać kolejnych plików.",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {GALLERY_FOLDER_OPTIONS.map((option) => {
            const active = folder === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFolder(option.value)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-brand-yellow/35 bg-brand-yellow/10 text-brand-yellow"
                    : "border-white/10 bg-white/5 text-white/65 hover:border-white/20 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Filtruj po nazwie pliku"
              className="pl-9"
            />
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-white/15 bg-white/6 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-brand-yellow/25 hover:text-brand-yellow">
            {uploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            Dodaj plik
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
              multiple
              onChange={(event) => void handleUpload(event.target.files)}
            />
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-brand-red/20 bg-brand-red/10 px-4 py-3 text-sm text-white/85">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-white/10 bg-[#151515] text-white/70">
          <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
          Ładowanie galerii...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#151515] px-6 text-center text-white/65">
          <FolderOpen className="mb-3 h-10 w-10 text-brand-yellow/70" />
          <p className="text-lg font-medium text-white">
            Brak plików w galerii
          </p>
          <p className="mt-2 max-w-md text-sm leading-6">
            Wgraj pierwszy obraz albo zmień folder, aby zobaczyć inne zasoby.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((asset) => {
            const isSelected = selectedUrl === asset.url;

            return (
              <article
                key={asset.pathname}
                className={`overflow-hidden rounded-2xl border bg-[#151515] ${
                  isSelected
                    ? "border-brand-yellow/35 shadow-[0_18px_45px_rgba(254,230,0,0.12)]"
                    : "border-white/10"
                }`}
              >
                <div className="relative aspect-4/3 border-b border-white/10 bg-black/20">
                  <Image
                    src={resolveMediaUrl(asset.url) || asset.previewUrl}
                    alt={asset.pathname}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <p className="line-clamp-2 text-sm font-medium text-white">
                      {asset.pathname.replace(/^gallery\//, "")}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      {formatUploadDate(asset.uploadedAt)} •{" "}
                      {formatFileSize(asset.size)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectable ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "secondary"}
                        onClick={() => onSelect?.(asset)}
                      >
                        Wybierz
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void navigator.clipboard.writeText(asset.url)
                      }
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Kopiuj URL
                    </Button>

                    {allowDelete ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(asset)}
                        className="text-brand-red hover:text-brand-red"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Usuń
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleLoadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : null}
            Załaduj więcej
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Usun plik z galerii"
        description={`Czy na pewno chcesz usunac "${deleteTarget?.pathname.replace(/^gallery\//, "") ?? "ten plik"}"?`}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
