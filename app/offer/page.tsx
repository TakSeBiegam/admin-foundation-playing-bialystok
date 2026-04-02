"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Layers3,
  Pencil,
  PlusCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import Sidebar from "@/app/components/Sidebar";
import OfferBlockModal, {
  type OfferBlockFormValues,
} from "@/app/components/OfferBlockModal";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import ToastContainer, { type ToastData } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/button";
import { gql } from "@/lib/graphql";
import type { OfferBlock } from "@/lib/types";
import Image from "next/image";

const OFFER_BLOCKS_QUERY = `query {
  offerBlocks {
    id
    section
    blockType
    badge
    title
    subtitle
    content
    items
    highlight
    imageUrl
    imageAlt
    ctaLabel
    ctaHref
    isFeatured
    order
    createdAt
    updatedAt
  }
}`;

const CREATE_OFFER_BLOCK = `mutation CreateOfferBlock($input: CreateOfferBlockInput!) {
  createOfferBlock(input: $input) {
    id
  }
}`;

const UPDATE_OFFER_BLOCK = `mutation UpdateOfferBlock($id: ID!, $input: UpdateOfferBlockInput!) {
  updateOfferBlock(id: $id, input: $input) {
    id
  }
}`;

const DELETE_OFFER_BLOCK = `mutation DeleteOfferBlock($id: ID!) {
  deleteOfferBlock(id: $id)
}`;

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildInput(values: OfferBlockFormValues) {
  const items = values.itemsText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    section: values.section.trim().toLowerCase(),
    blockType: values.blockType.trim().toLowerCase(),
    badge: normalizeText(values.badge),
    title: normalizeText(values.title),
    subtitle: normalizeText(values.subtitle),
    content: normalizeText(values.content),
    items,
    highlight: normalizeText(values.highlight),
    imageUrl: normalizeText(values.imageUrl),
    imageAlt: normalizeText(values.imageAlt),
    ctaLabel: normalizeText(values.ctaLabel),
    ctaHref: normalizeText(values.ctaHref),
    isFeatured: values.isFeatured,
    order: Number.isFinite(values.order) ? values.order : 0,
  };
}

export default function OfferPage() {
  const [blocks, setBlocks] = useState<OfferBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OfferBlock | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfferBlock | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "success") => {
      setToasts((previous) => [...previous, { id: Date.now(), message, type }]);
    },
    [],
  );

  const removeToast = (id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const loadBlocks = useCallback(async () => {
    try {
      const data = await gql<{ offerBlocks: OfferBlock[] }>(OFFER_BLOCKS_QUERY);
      setBlocks(
        [...(data.offerBlocks ?? [])].sort(
          (left, right) => left.order - right.order,
        ),
      );
    } catch {
      addToast("Błąd podczas ładowania bloków oferty", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadBlocks();
  }, [loadBlocks]);

  const sectionsCount = useMemo(
    () => new Set(blocks.map((block) => block.section)).size,
    [blocks],
  );

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (block: OfferBlock) => {
    setEditTarget(block);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSave = async (values: OfferBlockFormValues) => {
    const input = buildInput(values);

    try {
      if (editTarget) {
        await gql(UPDATE_OFFER_BLOCK, {
          id: editTarget.id,
          input,
        });
        addToast(`Zaktualizowano blok: ${input.title ?? editTarget.blockType}`);
      } else {
        await gql(CREATE_OFFER_BLOCK, { input });
        addToast(`Dodano blok: ${input.title ?? input.blockType}`);
      }

      await loadBlocks();
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
      await gql(DELETE_OFFER_BLOCK, { id: deleteTarget.id });
      addToast(
        `Usunięto blok: ${deleteTarget.title ?? deleteTarget.blockType}`,
        "error",
      );
      await loadBlocks();
    } catch (error) {
      addToast((error as Error).message || "Błąd usuwania", "error");
    }

    setDeleteTarget(null);
  };

  const handleMove = async (block: OfferBlock, direction: "up" | "down") => {
    const sorted = [...blocks].sort((left, right) => left.order - right.order);
    const currentIndex = sorted.findIndex((item) => item.id === block.id);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) {
      return;
    }

    const target = sorted[targetIndex];

    try {
      await gql(UPDATE_OFFER_BLOCK, {
        id: block.id,
        input: { order: target.order },
      });

      await gql(UPDATE_OFFER_BLOCK, {
        id: target.id,
        input: { order: block.order },
      });

      addToast("Zmieniono kolejność bloków");
      await loadBlocks();
    } catch (error) {
      addToast((error as Error).message || "Błąd zmiany kolejności", "error");
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Oferta</h1>
            <p className="mt-1 text-sm text-white/50">
              {loading
                ? "Ładowanie..."
                : `${blocks.length} bloków w ${sectionsCount} sekcjach`}
            </p>
          </div>

          <Button onClick={openCreate} variant="default">
            <PlusCircle className="h-4 w-4" />
            Dodaj blok
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white">
            <span className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Ładowanie...
          </div>
        ) : blocks.length === 0 ? (
          <div className="py-20 text-center text-white">
            <Layers3 className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p className="text-lg">Brak bloków oferty</p>
            <p className="mt-1 text-sm">
              Kliknij Dodaj blok, aby przygotować dynamiczną stronę ofertową.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#1a1a1a] text-xs uppercase tracking-wide text-white/50">
                  <th className="px-4 py-3 text-left font-medium">
                    Sekcja / typ
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Tytuł</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                    Kolejność
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">
                    Wyróżniony
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Akcje</th>
                </tr>
              </thead>

              <tbody>
                {blocks.map((block, index) => (
                  <tr
                    key={block.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/2 ${
                      index % 2 === 0 ? "" : "bg-white/1"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] text-brand-yellow">
                          {block.section}
                        </span>
                        <span className="text-xs text-white/60">
                          {block.blockType}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {block.title || block.badge || "Bez tytułu"}
                      </p>
                      {block.subtitle ? (
                        <p className="mt-0.5 max-w-130 truncate text-xs text-white/50">
                          {block.subtitle}
                        </p>
                      ) : null}
                    </td>

                    <td className="hidden px-4 py-3 text-white/70 md:table-cell">
                      {block.order}
                    </td>

                    <td className="hidden px-4 py-3 lg:table-cell">
                      {block.isFeatured ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-2.5 py-0.5 text-xs font-medium text-brand-yellow">
                          <Sparkles className="h-3 w-3" />
                          Tak
                        </span>
                      ) : (
                        <span className="text-white/35">Nie</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMove(block, "up")}
                          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                          title="Przesuń w górę"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMove(block, "down")}
                          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                          title="Przesuń w dół"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(block)}
                          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-brand-yellow/10 hover:text-brand-yellow"
                          title="Edytuj"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(block)}
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
        )}
      </main>

      <OfferBlockModal
        open={modalOpen}
        block={editTarget}
        onSave={handleSave}
        onClose={closeModal}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Usuń blok oferty"
        description={`Czy na pewno chcesz usunąć "${
          deleteTarget?.title ?? deleteTarget?.blockType
        }"? Tej operacji nie można cofnąć.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
