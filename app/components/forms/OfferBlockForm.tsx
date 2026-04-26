"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  CheckboxField,
  FormActions,
  FormField,
  FormMediaField,
  FormSelect,
  FormStaticValue,
  optionalUrlOrMediaPathPattern,
} from "@/app/components/forms/FormPrimitives";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  blockCategoryDefinitions,
  findMatchingBlockCategory,
  getBlockCategoryDefinition,
  getBlockFieldMeta,
  getContentPageLabel,
  resolveBlockCategoryDefaults,
  resolveBlockVisibleFields,
  type ContentPageKey,
  type OfferBlockFormField,
} from "@/lib/content-block-categories";
import type { OfferBlock } from "@/lib/types";

export type OfferBlockFormValues = {
  pageKey: ContentPageKey;
  categoryKey: string;
  section: string;
  blockType: string;
  badge: string;
  title: string;
  subtitle: string;
  content: string;
  itemsText: string;
  highlight: string;
  imageUrl: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  isFeatured: boolean;
  order: number;
};

interface OfferBlockFormProps {
  open: boolean;
  block?: OfferBlock | null;
  pageKey: ContentPageKey;
  defaultCategoryKey?: string;
  onSave: (data: OfferBlockFormValues) => void;
  onCancel: () => void;
  submitLabel: string;
}

const defaultValues: OfferBlockFormValues = {
  pageKey: "offer",
  categoryKey: "hero",
  section: "hero",
  blockType: "intro",
  badge: "",
  title: "",
  subtitle: "",
  content: "",
  itemsText: "",
  highlight: "",
  imageUrl: "",
  imageAlt: "",
  ctaLabel: "",
  ctaHref: "",
  isFeatured: false,
  order: 0,
};

function renderFieldMeta(field: OfferBlockFormField, categoryKey: string) {
  const definition = getBlockCategoryDefinition(categoryKey);
  return getBlockFieldMeta(field, {
    ...definition,
    pageDefaults: definition.pageDefaults,
  });
}

export default function OfferBlockForm({
  open,
  block,
  pageKey,
  defaultCategoryKey,
  onSave,
  onCancel,
  submitLabel,
}: OfferBlockFormProps) {
  const initialCategory = getBlockCategoryDefinition(
    defaultCategoryKey ?? "hero",
  );
  const [categoryKey, setCategoryKey] = useState(initialCategory.key);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfferBlockFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (block) {
      const matchedCategory = findMatchingBlockCategory(pageKey, block);
      const resolvedDefaults = resolveBlockCategoryDefaults(
        matchedCategory,
        pageKey,
      );

      setCategoryKey(matchedCategory.key);
      reset({
        pageKey,
        categoryKey: matchedCategory.key,
        section: block.section ?? resolvedDefaults.section,
        blockType: block.blockType ?? resolvedDefaults.blockType,
        badge: block.badge ?? "",
        title: block.title ?? "",
        subtitle: block.subtitle ?? "",
        content: block.content ?? "",
        itemsText: (block.items ?? []).join("\n"),
        highlight: block.highlight ?? "",
        imageUrl: block.imageUrl ?? "",
        imageAlt: block.imageAlt ?? "",
        ctaLabel: block.ctaLabel ?? "",
        ctaHref: block.ctaHref ?? "",
        isFeatured: block.isFeatured,
        order: block.order,
      });
      return;
    }

    const category = getBlockCategoryDefinition(
      defaultCategoryKey ?? initialCategory.key,
    );
    const resolvedDefaults = resolveBlockCategoryDefaults(category, pageKey);
    setCategoryKey(category.key);

    reset({
      ...defaultValues,
      pageKey,
      categoryKey: category.key,
      section: resolvedDefaults.section,
      blockType: resolvedDefaults.blockType,
    });
  }, [block, defaultCategoryKey, initialCategory.key, open, pageKey, reset]);

  const activeCategory = getBlockCategoryDefinition(categoryKey);
  const visibleFields = useMemo(
    () => new Set(resolveBlockVisibleFields(activeCategory, pageKey)),
    [activeCategory, pageKey],
  );
  const currentSection = watch("section");
  const currentBlockType = watch("blockType");
  const imageUrlValue = watch("imageUrl");

  function handleCategoryChange(nextCategoryKey: string) {
    const nextCategory = getBlockCategoryDefinition(nextCategoryKey);
    const resolvedDefaults = resolveBlockCategoryDefaults(
      nextCategory,
      pageKey,
    );
    setCategoryKey(nextCategory.key);
    setValue("pageKey", pageKey, { shouldDirty: true });
    setValue("categoryKey", nextCategory.key, { shouldDirty: true });
    setValue("section", resolvedDefaults.section, { shouldDirty: true });
    setValue("blockType", resolvedDefaults.blockType, { shouldDirty: true });
  }

  const pageLabel = getContentPageLabel(pageKey);
  const resolvedDefaults = resolveBlockCategoryDefaults(
    activeCategory,
    pageKey,
  );

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6 pt-2">
      <input type="hidden" {...register("pageKey")} />
      <input type="hidden" {...register("categoryKey")} />
      {!visibleFields.has("section") ? (
        <input type="hidden" {...register("section")} />
      ) : null}
      {!visibleFields.has("blockType") ? (
        <input type="hidden" {...register("blockType")} />
      ) : null}

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <FormStaticValue label="Podstrona" value={pageLabel} />
          <FormField label="Kategoria *" htmlFor="content-category">
            <FormSelect
              id="content-category"
              value={categoryKey}
              onChange={(event) => handleCategoryChange(event.target.value)}
            >
              {blockCategoryDefinitions.map((definition) => (
                <option key={definition.key} value={definition.key}>
                  {definition.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {visibleFields.has("section") ? (
            <FormField
              label={renderFieldMeta("section", categoryKey).label}
              htmlFor="content-section"
              error={errors.section?.message}
              helpText={renderFieldMeta("section", categoryKey).helpText}
            >
              <Input
                id="content-section"
                placeholder={
                  renderFieldMeta("section", categoryKey).placeholder
                }
                {...register("section", {
                  required: "Sekcja jest wymagana",
                  minLength: { value: 2, message: "Min. 2 znaki" },
                })}
              />
            </FormField>
          ) : (
            <FormStaticValue
              label="Sekcja techniczna"
              value={currentSection || resolvedDefaults.section}
            />
          )}

          {visibleFields.has("blockType") ? (
            <FormField
              label={renderFieldMeta("blockType", categoryKey).label}
              htmlFor="content-block-type"
              error={errors.blockType?.message}
              helpText={renderFieldMeta("blockType", categoryKey).helpText}
            >
              <Input
                id="content-block-type"
                placeholder={
                  renderFieldMeta("blockType", categoryKey).placeholder
                }
                {...register("blockType", {
                  required: "Typ bloku jest wymagany",
                  minLength: { value: 2, message: "Min. 2 znaki" },
                })}
              />
            </FormField>
          ) : (
            <FormStaticValue
              label="Typ bloku"
              value={currentBlockType || resolvedDefaults.blockType}
            />
          )}

          <FormField
            label={renderFieldMeta("order", categoryKey).label}
            htmlFor="content-order"
          >
            <Input
              id="content-order"
              type="number"
              placeholder={renderFieldMeta("order", categoryKey).placeholder}
              {...register("order", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        {visibleFields.has("badge") ? (
          <FormField
            label={renderFieldMeta("badge", categoryKey).label}
            htmlFor="content-badge"
          >
            <Input
              id="content-badge"
              placeholder={renderFieldMeta("badge", categoryKey).placeholder}
              {...register("badge")}
            />
          </FormField>
        ) : null}

        {visibleFields.has("title") ? (
          <FormField
            label={renderFieldMeta("title", categoryKey).label}
            htmlFor="content-title"
          >
            <Input
              id="content-title"
              placeholder={renderFieldMeta("title", categoryKey).placeholder}
              {...register("title")}
            />
          </FormField>
        ) : null}

        {visibleFields.has("subtitle") ? (
          <FormField
            label={renderFieldMeta("subtitle", categoryKey).label}
            htmlFor="content-subtitle"
          >
            <Input
              id="content-subtitle"
              placeholder={renderFieldMeta("subtitle", categoryKey).placeholder}
              {...register("subtitle")}
            />
          </FormField>
        ) : null}

        {visibleFields.has("content") ? (
          <FormField
            label={renderFieldMeta("content", categoryKey).label}
            htmlFor="content-body"
            helpText={renderFieldMeta("content", categoryKey).helpText}
          >
            <Textarea
              id="content-body"
              rows={renderFieldMeta("content", categoryKey).rows}
              placeholder={renderFieldMeta("content", categoryKey).placeholder}
              {...register("content")}
            />
          </FormField>
        ) : null}

        {visibleFields.has("itemsText") ? (
          <FormField
            label={renderFieldMeta("itemsText", categoryKey).label}
            htmlFor="content-items"
            helpText={renderFieldMeta("itemsText", categoryKey).helpText}
          >
            <Textarea
              id="content-items"
              rows={renderFieldMeta("itemsText", categoryKey).rows}
              placeholder={
                renderFieldMeta("itemsText", categoryKey).placeholder
              }
              {...register("itemsText")}
            />
          </FormField>
        ) : null}

        {visibleFields.has("highlight") ? (
          <FormField
            label={renderFieldMeta("highlight", categoryKey).label}
            htmlFor="content-highlight"
          >
            <Textarea
              id="content-highlight"
              rows={renderFieldMeta("highlight", categoryKey).rows}
              placeholder={
                renderFieldMeta("highlight", categoryKey).placeholder
              }
              {...register("highlight")}
            />
          </FormField>
        ) : null}

        {visibleFields.has("image") || visibleFields.has("imageAlt") ? (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleFields.has("image") ? (
              <FormMediaField
                registration={register("imageUrl", {
                  pattern: optionalUrlOrMediaPathPattern,
                })}
                label={renderFieldMeta("image", categoryKey).label}
                inputId="content-image-url"
                value={imageUrlValue}
                placeholder={
                  renderFieldMeta("image", categoryKey).placeholder ?? ""
                }
                folder="offer"
                error={errors.imageUrl?.message}
                onChange={(value) =>
                  setValue("imageUrl", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            ) : null}

            {visibleFields.has("imageAlt") ? (
              <FormField
                label={renderFieldMeta("imageAlt", categoryKey).label}
                htmlFor="content-image-alt"
              >
                <Input
                  id="content-image-alt"
                  placeholder={
                    renderFieldMeta("imageAlt", categoryKey).placeholder
                  }
                  {...register("imageAlt")}
                />
              </FormField>
            ) : null}
          </div>
        ) : null}

        {visibleFields.has("ctaLabel") || visibleFields.has("ctaHref") ? (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleFields.has("ctaLabel") ? (
              <FormField
                label={renderFieldMeta("ctaLabel", categoryKey).label}
                htmlFor="content-cta-label"
              >
                <Input
                  id="content-cta-label"
                  placeholder={
                    renderFieldMeta("ctaLabel", categoryKey).placeholder
                  }
                  {...register("ctaLabel")}
                />
              </FormField>
            ) : null}

            {visibleFields.has("ctaHref") ? (
              <FormField
                label={renderFieldMeta("ctaHref", categoryKey).label}
                htmlFor="content-cta-href"
                error={errors.ctaHref?.message}
              >
                <Input
                  id="content-cta-href"
                  placeholder={
                    renderFieldMeta("ctaHref", categoryKey).placeholder
                  }
                  {...register("ctaHref", {
                    pattern: optionalUrlOrMediaPathPattern,
                  })}
                />
              </FormField>
            ) : null}
          </div>
        ) : null}

        {visibleFields.has("isFeatured") ? (
          <CheckboxField
            label={renderFieldMeta("isFeatured", categoryKey).label}
            {...register("isFeatured")}
          />
        ) : null}
      </div>

      <FormActions
        onCancel={onCancel}
        submitLabel={submitLabel}
        className="border-t border-white/10 pt-4"
      />
    </form>
  );
}
