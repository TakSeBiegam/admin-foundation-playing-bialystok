"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Layers3,
  Lock,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { useAdminAccess } from "@/app/components/AdminAccessProvider";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import OfferBlockModal, {
  type OfferBlockFormValues,
} from "@/app/components/OfferBlockModal";
import Sidebar from "@/app/components/Sidebar";
import ToastContainer, { type ToastData } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/button";
import { getAdminResourceLabel } from "@/lib/admin-resources";
import {
  findMatchingBlockCategory,
  getContentPageLabel,
  type ContentPageKey,
} from "@/lib/content-block-categories";
import { gql } from "@/lib/graphql";
import type { AdminResource, OfferBlock } from "@/lib/types";

const CONTENT_BLOCKS_QUERY = `
  query ContentBlocksAdmin($pageKey: String!) {
    offerBlocks(pageKey: $pageKey) {
      id
      pageKey
      categoryKey
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
  }
`;

const CREATE_OFFER_BLOCK = `
  mutation CreateOfferBlock($input: CreateOfferBlockInput!) {
    createOfferBlock(input: $input) {
      id
    }
  }
`;

const UPDATE_OFFER_BLOCK = `
  mutation UpdateOfferBlock($id: ID!, $input: UpdateOfferBlockInput!) {
    updateOfferBlock(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE_OFFER_BLOCK = `
  mutation DeleteOfferBlock($id: ID!) {
    deleteOfferBlock(id: $id)
  }
`;

interface ContentBlocksAdminPageProps {
  pageKey: ContentPageKey;
  resource: AdminResource;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  defaultCategoryKey?: string;
}

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
    pageKey: values.pageKey,
    categoryKey: normalizeText(values.categoryKey),
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

function PageScaffold({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

function AccessState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Lock;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-lg rounded-4xl border border-white/10 bg-[#121212] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function ContentBlocksAdminPage({
  pageKey,
  resource,
  title,
  description,
  emptyTitle,
  emptyDescription,
  defaultCategoryKey,
}: ContentBlocksAdminPageProps) {
  const { canAccess, loading: accessLoading } = useAdminAccess();
  const [blocks, setBlocks] = useState<OfferBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OfferBlock | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfferBlock | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const canRead = canAccess(resource, "read");
  const canWrite = canAccess(resource, "write");
  const canDelete = canAccess(resource, "delete");

  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "success") => {
      setToasts((current) => [...current, { id: Date.now(), message, type }]);
    },
    [],
  );

  const removeToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gql<{ offerBlocks: OfferBlock[] }>(
        CONTENT_BLOCKS_QUERY,
        {
          pageKey,
        },
      );
      setBlocks(
        [...(data.offerBlocks ?? [])].sort(
          (left, right) => left.order - right.order,
        ),
      );
    } catch (error) {
      addToast(
        (error as Error).message || "Nie udalo sie zaladowac blokow.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [addToast, pageKey]);

  useEffect(() => {
    if (accessLoading) {
      return;
    }

    if (!canRead) {
      setLoading(false);
      return;
    }

    void loadBlocks();
  }, [accessLoading, canRead, loadBlocks]);

  const categoriesInUse = useMemo(() => {
    return Array.from(
      new Set(
        blocks.map((block) => findMatchingBlockCategory(pageKey, block).label),
      ),
    );
  }, [blocks, pageKey]);

  const metrics = useMemo(() => {
    return {
      total: blocks.length,
      sections: new Set(blocks.map((block) => block.section)).size,
      featured: blocks.filter((block) => block.isFeatured).length,
    };
  }, [blocks]);

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(block: OfferBlock) {
    setEditTarget(block);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
  }

  async function handleSave(values: OfferBlockFormValues) {
    const input = buildInput(values);

    try {
      if (editTarget) {
        await gql(UPDATE_OFFER_BLOCK, { id: editTarget.id, input });
        addToast(`Zaktualizowano blok: ${input.title ?? editTarget.blockType}`);
      } else {
        await gql(CREATE_OFFER_BLOCK, { input });
        addToast(`Dodano blok: ${input.title ?? input.blockType}`);
      }

      await loadBlocks();
      closeModal();
    } catch (error) {
      addToast(
        (error as Error).message || "Nie udalo sie zapisac bloku.",
        "error",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await gql(DELETE_OFFER_BLOCK, { id: deleteTarget.id });
      addToast(
        `Usunieto blok: ${deleteTarget.title ?? deleteTarget.blockType}`,
        "error",
      );
      await loadBlocks();
    } catch (error) {
      addToast(
        (error as Error).message || "Nie udalo sie usunac bloku.",
        "error",
      );
    }

    setDeleteTarget(null);
  }

  async function handleMove(block: OfferBlock, direction: "up" | "down") {
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
        input: { order: target.order, pageKey },
      });
      await gql(UPDATE_OFFER_BLOCK, {
        id: target.id,
        input: { order: block.order, pageKey },
      });
      addToast("Zmieniono kolejnosc blokow.");
      await loadBlocks();
    } catch (error) {
      addToast(
        (error as Error).message || "Nie udalo sie zmienic kolejnosci.",
        "error",
      );
    }
  }

  if (accessLoading) {
    return (
      <PageScaffold>
        <AccessState
          icon={Layers3}
          title="Trwa synchronizacja panelu"
          description="Laduja sie uprawnienia i tresci dla tej strony."
        />
      </PageScaffold>
    );
  }

  if (!canRead) {
    return (
      <PageScaffold>
        <AccessState
          icon={Lock}
          title={`Brak dostepu do ${getAdminResourceLabel(resource).toLowerCase()}`}
          description="Ta rola nie ma prawa odczytu dla tego widoku."
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
            {getContentPageLabel(pageKey)} / Edycja tresci
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
              {description}
            </p>
          ) : null}
        </div>

        <Button onClick={openCreate} variant="default" disabled={!canWrite}>
          <PlusCircle className="h-4 w-4" />
          Dodaj blok
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Bloki
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {metrics.total}
              </p>
              <p className="mt-2 text-sm text-white/50">Na tej stronie</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Uklady
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {metrics.sections}
              </p>
              <p className="mt-2 text-sm text-white/50">
                Rozne warianty sekcji
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Wyroznione
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {metrics.featured}
              </p>
              <p className="mt-2 text-sm text-white/50">
                Widoczne mocniej na stronie
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-[28px] border border-white/10 bg-[#121212] py-24 text-white">
              <span className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              Ladowanie blokow...
            </div>
          ) : blocks.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/12 bg-[#121212] py-24 text-center text-white">
              <Layers3 className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">{emptyTitle}</p>
              <p className="mt-2 text-sm text-white/50">{emptyDescription}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#121212]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20 text-xs uppercase tracking-[0.18em] text-white/40">
                    <th className="px-4 py-4 text-left font-medium">
                      Kategoria
                    </th>
                    <th className="px-4 py-4 text-left font-medium">Tresc</th>
                    <th className="hidden px-4 py-4 text-left font-medium lg:table-cell">
                      Status
                    </th>
                    <th className="px-4 py-4 text-right font-medium">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block, index) => {
                    const category = findMatchingBlockCategory(pageKey, block);
                    return (
                      <tr
                        key={block.id}
                        className={
                          index % 2 === 0
                            ? "border-b border-white/5"
                            : "border-b border-white/5 bg-white/2"
                        }
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            <span className="inline-flex rounded-full border border-brand-yellow/25 bg-brand-yellow/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-brand-yellow">
                              {category.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="font-medium text-white">
                            {block.title || block.badge || "Bez tytulu"}
                          </p>
                          <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/52">
                            {block.subtitle ||
                              block.content ||
                              block.highlight ||
                              "Ten blok nie ma jeszcze opisu pomocniczego."}
                          </p>
                        </td>
                        <td className="hidden px-4 py-4 align-top lg:table-cell">
                          <div className="space-y-2 text-xs text-white/60">
                            <p>Kolejnosc: {block.order}</p>
                            <p>{block.isFeatured ? "Featured" : "Standard"}</p>
                            <p>
                              {block.items?.length
                                ? `${block.items.length} elementow listy`
                                : "Bez listy"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMove(block, "up")}
                              disabled={!canWrite}
                              className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                              title="Przesun w gore"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(block, "down")}
                              disabled={!canWrite}
                              className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                              title="Przesun w dol"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(block)}
                              disabled={!canWrite}
                              className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-brand-yellow/10 hover:text-brand-yellow disabled:pointer-events-none disabled:opacity-30"
                              title="Edytuj"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(block)}
                              disabled={!canDelete}
                              className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-brand-red/10 hover:text-brand-red disabled:pointer-events-none disabled:opacity-30"
                              title="Usun"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
              Uprawnienia dla roli
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              {(
                [
                  ["Podglad", canRead],
                  ["Edycja", canWrite],
                  ["Usuwanie", canDelete],
                ] as Array<[string, boolean]>
              ).map(([label, enabled]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <span>{label}</span>
                  <span
                    className={enabled ? "text-emerald-300" : "text-white/35"}
                  >
                    {enabled ? "Aktywne" : "Brak"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {categoriesInUse.length > 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
                Kategorie na stronie
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {categoriesInUse.map((categoryLabel) => (
                  <span
                    key={categoryLabel}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/72"
                  >
                    {categoryLabel}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {!canWrite ? (
            <div className="rounded-[28px] border border-brand-yellow/25 bg-brand-yellow/10 p-5 text-sm text-white/75">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
                <p>Ta rola ma tylko podglad. Edycja blokow jest zablokowana.</p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <OfferBlockModal
        open={modalOpen}
        block={editTarget}
        pageKey={pageKey}
        defaultCategoryKey={defaultCategoryKey}
        onSave={handleSave}
        onClose={closeModal}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Usun blok z ${getContentPageLabel(pageKey).toLowerCase()}`}
        description={`Czy na pewno chcesz usunac "${deleteTarget?.title ?? deleteTarget?.blockType}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </PageScaffold>
  );
}
