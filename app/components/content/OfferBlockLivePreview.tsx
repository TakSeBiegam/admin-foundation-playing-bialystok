"use client";

import type { ReactNode } from "react";
import { ArrowRight, Check, Image as ImageIcon } from "lucide-react";

import {
  type ContentPageKey,
  getContentPageLabel,
} from "@/lib/content-block-categories";
import { cn } from "@/lib/utils";

type OfferBlockLivePreviewProps = {
  pageKey: ContentPageKey;
  categoryKey: string;
  categoryLabel: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  items: string[];
  highlight?: string;
  imageUrl?: string;
  ctaLabel?: string;
  isFeatured: boolean;
  fallbackEyebrow: string;
  fallbackTitle: string;
  fallbackDescription: string;
  showBadge?: boolean;
  showSubtitle?: boolean;
};

function PreviewImage({
  imageUrl,
  compact = false,
}: {
  imageUrl?: string;
  compact?: boolean;
}) {
  if (!imageUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-3xl border border-dashed border-white/14 bg-black/20 text-white/40",
          compact ? "min-h-32" : "min-h-44",
        )}
      >
        <div className="flex items-center gap-2 text-sm">
          <ImageIcon className="h-4 w-4" />
          Miejsce na grafike
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-white/12 bg-cover bg-center shadow-[0_24px_60px_rgba(0,0,0,0.28)]",
        compact ? "min-h-32" : "min-h-44",
      )}
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
}

function PreviewItems({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-2 text-sm text-white/78">
      {items.slice(0, 4).map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-yellow" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PreviewAction({
  label,
  emphasized = false,
}: {
  label: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
        emphasized
          ? "border-brand-yellow bg-brand-yellow text-black"
          : "border-white/10 bg-transparent text-white/80",
      )}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </div>
  );
}

function AboutUsPreviewSection({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div></div>
      <div className="rounded-lg border border-white/10 bg-black/20 p-4 md:p-5">
        {children}
      </div>
    </section>
  );
}

function AboutUsPlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border border-dashed border-white/10 bg-transparent p-4 text-white/55">
      <p className="text-sm font-medium text-white/70">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6">{description}</p>
    </div>
  );
}

function AboutUsCardMedia({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) {
    return (
      <div className="flex aspect-16/10 w-full items-center justify-center border-b border-dashed border-white/10 bg-black/10 text-white/40">
        <div className="flex items-center gap-2 text-sm">
          <ImageIcon className="h-4 w-4" />
          Miejsce na grafike modulu
        </div>
      </div>
    );
  }

  return (
    <div
      className="aspect-16/10 w-full border-b border-white/10 bg-cover bg-center"
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
}

type AboutUsLivePreviewProps = {
  categoryKey: string;
  categoryLabel: string;
  badge?: string;
  heading: string;
  supportingText: string;
  secondaryText: string;
  detailText: string;
  items: string[];
  highlight?: string;
  imageUrl?: string;
  actionLabel: string;
  hasAction: boolean;
  statValue: string;
  isFeatured: boolean;
  showBadge?: boolean;
  showSubtitle?: boolean;
};

function AboutUsLivePreview({
  categoryKey,
  categoryLabel,
  badge,
  heading,
  supportingText,
  secondaryText,
  detailText,
  items,
  highlight,
  imageUrl,
  actionLabel,
  hasAction,
  statValue,
  isFeatured,
  showBadge = true,
  showSubtitle = true,
}: AboutUsLivePreviewProps) {
  const placement =
    categoryKey === "hero"
      ? {
          description:
            "Na stronie O nas ten blok staje sie glownym naglowkiem i wprowadzeniem na gorze strony.",
        }
      : categoryKey === "stat"
        ? {
            description:
              "Ten wpis jest jednym z kafelkow widocznych w siatce statystyk pod sekcja otwierajaca.",
          }
        : categoryKey === "cta"
          ? {
              description:
                "Na koncu strony blok wyswietla sie jako szeroki baner z wezwanie do dzialania.",
            }
          : {
              description:
                "Blok trafi do siatki dodatkowych sekcji i bedzie wyswietlany obok pozostalych modulow O nas.",
            };

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-[#161616] p-4",
        isFeatured && "border-brand-yellow/30",
      )}
    >
      <div className="mb-4 border-b border-white/10 pb-4">
        <div>
          <p className="mt-1 text-base font-semibold text-white">
            {categoryLabel}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            {placement.description}
            {isFeatured ? " Ten blok jest oznaczony jako wyrozniony." : ""}
          </p>
        </div>
      </div>

      {categoryKey === "hero" ? (
        <AboutUsPreviewSection>
          <div className="space-y-4">
            {showBadge && badge ? (
              <p className="text-sm text-white/55">{badge}</p>
            ) : null}
            <div className="max-w-4xl space-y-4">
              <h3 className="max-w-3xl text-3xl font-semibold leading-tight text-white md:text-4xl">
                {heading}
              </h3>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-white/80 md:text-base">
                <p>{supportingText}</p>
                {detailText ? <p>{detailText}</p> : null}
              </div>
            </div>
          </div>
        </AboutUsPreviewSection>
      ) : null}

      {categoryKey === "stat" ? (
        <AboutUsPreviewSection>
          <div className="grid gap-3 md:grid-cols-[minmax(0,280px)_1fr]">
            <div className="border border-white/10 bg-[#111111] p-4">
              <p className="text-4xl font-semibold text-brand-yellow md:text-5xl">
                {statValue}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                {supportingText}
              </p>
            </div>
            <AboutUsPlaceholderCard
              title="Kontekst sekcji"
              description="W widoku publicznym ten kafelek bedzie stal obok pozostalych statystyk, a nie jako samodzielny komponent."
            />
          </div>
        </AboutUsPreviewSection>
      ) : null}

      {categoryKey === "cta" ? (
        <AboutUsPreviewSection>
          <div className="flex flex-col gap-4 border border-white/10 bg-[#111111] p-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-semibold text-white md:text-3xl">
                {heading}
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/80">
                {supportingText}
              </p>
              <p className="mt-3 text-xs text-white/45">
                Liczba wydarzen dopisuje sie automatycznie na stronie
                publicznej.
              </p>
            </div>
            <PreviewAction label={actionLabel} emphasized />
          </div>
        </AboutUsPreviewSection>
      ) : null}

      {!["hero", "stat", "cta"].includes(categoryKey) ? (
        <AboutUsPreviewSection>
          <article className="overflow-hidden border border-white/10 bg-[#111111]">
            <AboutUsCardMedia imageUrl={imageUrl} />

            <div className="space-y-4 p-4">
              {showBadge && badge ? (
                <p className="text-sm text-white/55">{badge}</p>
              ) : null}

              <div>
                <h3 className="text-2xl font-semibold text-white">{heading}</h3>
                {showSubtitle && secondaryText ? (
                  <p className="mt-1 text-sm text-white/60">{secondaryText}</p>
                ) : null}
              </div>

              <p className="text-sm leading-7 text-white/80">
                {supportingText}
              </p>

              {highlight ? (
                <p className="border-l-2 border-white/15 pl-3 text-sm leading-6 text-white/70">
                  {highlight}
                </p>
              ) : null}

              {items.length > 0 ? (
                <ul className="space-y-2">
                  {items.slice(0, 4).map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-start gap-3 text-sm leading-6 text-white/76"
                    >
                      <span className="mt-2 h-1.5 w-1.5 bg-brand-yellow" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {hasAction ? (
                <PreviewAction label={actionLabel} emphasized />
              ) : null}

              <p className="text-xs text-white/45">
                Na szerszym ekranie ten modul moze pojawic sie obok kolejnej
                karty.
              </p>
            </div>
          </article>
        </AboutUsPreviewSection>
      ) : null}
    </div>
  );
}

function formatStatValue(title: string, highlight: string) {
  const numericCandidate = [title, highlight].find((value) => /\d/.test(value));
  return numericCandidate || title;
}

export default function OfferBlockLivePreview({
  pageKey,
  categoryKey,
  categoryLabel,
  badge,
  title,
  subtitle,
  content,
  items,
  highlight,
  imageUrl,
  ctaLabel,
  isFeatured,
  fallbackEyebrow,
  fallbackTitle,
  fallbackDescription,
  showBadge = true,
  showSubtitle = true,
}: OfferBlockLivePreviewProps) {
  const eyebrow = badge || fallbackEyebrow;
  const heading = title || fallbackTitle;
  const supportingText = content || subtitle || fallbackDescription;
  const secondaryText = subtitle && subtitle !== supportingText ? subtitle : "";
  const actionLabel = ctaLabel || "Dowiedz sie wiecej";
  const statValue = formatStatValue(heading, highlight || "");
  const isAboutUsPage = pageKey === "about-us";
  const aboutUsDetailText = highlight || secondaryText;

  if (isAboutUsPage) {
    return (
      <AboutUsLivePreview
        categoryKey={categoryKey}
        categoryLabel={categoryLabel}
        badge={badge}
        heading={heading}
        supportingText={supportingText}
        secondaryText={secondaryText}
        detailText={aboutUsDetailText}
        items={items}
        highlight={highlight}
        imageUrl={imageUrl}
        actionLabel={actionLabel}
        hasAction={Boolean(ctaLabel)}
        statValue={statValue}
        isFeatured={isFeatured}
        showBadge={showBadge}
        showSubtitle={showSubtitle}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-[30px] border border-white/10 bg-[#161616] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)]",
        isFeatured && "ring-1 ring-brand-yellow/30",
      )}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">
            Podglad komponentu
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {categoryLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/52">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
            {getContentPageLabel(pageKey)}
          </span>
          {isFeatured ? (
            <span className="rounded-full border border-brand-yellow/25 bg-brand-yellow/10 px-3 py-1 text-brand-yellow">
              Wyrozniony
            </span>
          ) : null}
        </div>
      </div>

      {categoryKey === "hero" ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)]">
          <div className="space-y-4 rounded-[28px] border border-white/10 bg-linear-to-br from-brand-red/14 via-white/4 to-brand-yellow/14 p-6">
            {showBadge ? (
              <div className="inline-flex rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/72">
                {eyebrow}
              </div>
            ) : null}
            <div className="space-y-3">
              <h3 className="max-w-xl text-3xl font-semibold leading-tight text-white">
                {heading}
              </h3>
              {showSubtitle && secondaryText ? (
                <p className="text-base text-white/68">{secondaryText}</p>
              ) : null}
              <p className="max-w-xl text-sm leading-7 text-white/75">
                {supportingText}
              </p>
            </div>
            <PreviewItems items={items} />
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-white">
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
          <PreviewImage imageUrl={imageUrl} />
        </section>
      ) : null}

      {categoryKey === "stat" ? (
        <section className="rounded-[28px] border border-white/10 bg-linear-to-br from-emerald-400/16 via-black/20 to-cyan-400/12 p-8 text-center">
          {showBadge ? (
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
              {eyebrow}
            </p>
          ) : null}
          <p className="mt-5 text-5xl font-semibold text-white">{statValue}</p>
          <p className="mt-3 text-sm text-white/75">{supportingText}</p>
        </section>
      ) : null}

      {categoryKey === "gallery" ? (
        <section className="space-y-4">
          <div className="space-y-2">
            {showBadge ? (
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                {eyebrow}
              </p>
            ) : null}
            <h3 className="text-2xl font-semibold text-white">{heading}</h3>
            <p className="max-w-2xl text-sm leading-7 text-white/72">
              {supportingText}
            </p>
          </div>
          <PreviewImage imageUrl={imageUrl} />
        </section>
      ) : null}

      {categoryKey === "cta" ? (
        <section className="rounded-[28px] border border-white/10 bg-linear-to-r from-brand-yellow/16 via-black/20 to-brand-red/12 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              {showBadge ? (
                <div className="inline-flex rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/72">
                  {eyebrow}
                </div>
              ) : null}
              <h3 className="max-w-2xl text-3xl font-semibold leading-tight text-white">
                {heading}
              </h3>
              <p className="max-w-2xl text-sm leading-7 text-white/74">
                {supportingText}
              </p>
            </div>
            <PreviewAction label={actionLabel} />
          </div>
        </section>
      ) : null}

      {categoryKey === "service" || categoryKey === "partnership" ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.72fr)]">
          <div className="rounded-[28px] border border-white/10 bg-white/4 p-5">
            {showBadge ? (
              <div className="inline-flex rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/72">
                {eyebrow}
              </div>
            ) : null}
            <h3 className="mt-4 text-2xl font-semibold text-white">
              {heading}
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/72">
              {supportingText}
            </p>
            {highlight ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/78">
                {highlight}
              </div>
            ) : null}
            <div className="mt-4">
              <PreviewItems items={items} />
            </div>
            {ctaLabel ? (
              <div className="mt-5">
                <PreviewAction label={actionLabel} />
              </div>
            ) : null}
          </div>
          <PreviewImage imageUrl={imageUrl} compact />
        </section>
      ) : null}

      {categoryKey === "benefits" || categoryKey === "scope" ? (
        <section className="space-y-4">
          <div className="space-y-2">
            {showBadge ? (
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                {eyebrow}
              </p>
            ) : null}
            <h3 className="text-2xl font-semibold text-white">{heading}</h3>
            <p className="max-w-2xl text-sm leading-7 text-white/72">
              {supportingText}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {items.slice(0, 4).map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80"
              >
                {item}
              </div>
            ))}
            {items.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/12 bg-black/15 px-4 py-6 text-sm text-white/45 md:col-span-2">
                Dodaj elementy listy, aby zobaczyc gotowy uklad korzysci.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {categoryKey === "process" || categoryKey === "faq" ? (
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
              {eyebrow}
            </p>
            <h3 className="text-2xl font-semibold text-white">{heading}</h3>
            <p className="max-w-2xl text-sm leading-7 text-white/72">
              {supportingText}
            </p>
          </div>
          <div className="space-y-3">
            {items.slice(0, 4).map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex gap-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm leading-7 text-white/80">{item}</p>
              </div>
            ))}
            {items.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/12 bg-black/15 px-4 py-6 text-sm text-white/45">
                Wpisz kolejne punkty, aby zobaczyc finalny uklad krokow lub
                pytan.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {![
        "hero",
        "stat",
        "gallery",
        "cta",
        "service",
        "partnership",
        "benefits",
        "scope",
        "process",
        "faq",
      ].includes(categoryKey) ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.72fr)]">
          <div className="rounded-[28px] border border-white/10 bg-white/4 p-5">
            <div className="inline-flex rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/72">
              {eyebrow}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-white">
              {heading}
            </h3>
            {showSubtitle && secondaryText ? (
              <p className="mt-2 text-sm text-white/65">{secondaryText}</p>
            ) : null}
            <p className="mt-3 text-sm leading-7 text-white/72">
              {supportingText}
            </p>
            <div className="mt-4">
              <PreviewItems items={items} />
            </div>
          </div>
          <PreviewImage imageUrl={imageUrl} compact />
        </section>
      ) : null}
    </div>
  );
}
