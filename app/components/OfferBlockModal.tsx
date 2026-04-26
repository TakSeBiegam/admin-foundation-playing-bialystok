"use client";

import { AdminFormDialog } from "@/app/components/forms/FormPrimitives";
import OfferBlockForm, {
  type OfferBlockFormValues,
} from "@/app/components/forms/OfferBlockForm";
import type { ContentPageKey } from "@/lib/content-block-categories";
import type { OfferBlock } from "@/lib/types";

export type { OfferBlockFormValues } from "@/app/components/forms/OfferBlockForm";

interface OfferBlockModalProps {
  open: boolean;
  block?: OfferBlock | null;
  pageKey: ContentPageKey;
  defaultCategoryKey?: string;
  onSave: (data: OfferBlockFormValues) => void;
  onClose: () => void;
}

export default function OfferBlockModal({
  open,
  block,
  pageKey,
  defaultCategoryKey,
  onSave,
  onClose,
}: OfferBlockModalProps) {
  const contextLabel = pageKey === "about-us" ? "sekcji O nas" : "oferty";

  return (
    <AdminFormDialog
      open={open}
      onClose={onClose}
      title={
        block ? `Edytuj blok ${contextLabel}` : `Nowy blok ${contextLabel}`
      }
      contentClassName="max-w-6xl"
    >
      <OfferBlockForm
        open={open}
        block={block}
        pageKey={pageKey}
        defaultCategoryKey={defaultCategoryKey}
        onSave={onSave}
        onCancel={onClose}
        submitLabel={block ? "Zapisz zmiany" : "Dodaj blok"}
      />
    </AdminFormDialog>
  );
}
