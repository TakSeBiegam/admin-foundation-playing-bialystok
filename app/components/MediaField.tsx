"use client";

import Image from "next/image";
import { useState, type ClipboardEvent } from "react";
import { Images, LoaderCircle, Trash2 } from "lucide-react";
import GalleryBrowser from "@/app/components/GalleryBrowser";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ensureNamedImageFile, uploadGalleryFile } from "@/lib/gallery-client";
import { resolveMediaUrl } from "@/lib/media";
import type { GalleryAsset, GalleryFolder } from "@/lib/types";

type MediaFieldProps = {
  label: string;
  inputId: string;
  value: string;
  placeholder: string;
  folder: GalleryFolder;
  error?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

export default function MediaField({
  label,
  inputId,
  value,
  placeholder,
  folder,
  error,
  onChange,
  onClear,
}: MediaFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const previewUrl = resolveMediaUrl(value);

  function handleSelect(asset: GalleryAsset) {
    onChange(asset.url);
    setUploadFeedback(null);
    setDialogOpen(false);
  }

  function extractImageFromClipboard(event: ClipboardEvent<HTMLInputElement>) {
    const imageItem = Array.from(event.clipboardData.items).find(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );

    const imageFile = imageItem?.getAsFile();
    return imageFile ? ensureNamedImageFile(imageFile) : null;
  }

  async function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedImage = extractImageFromClipboard(event);
    if (!pastedImage) {
      setUploadFeedback(null);
      return;
    }

    event.preventDefault();
    setUploading(true);
    setUploadFeedback(null);

    try {
      const asset = await uploadGalleryFile(pastedImage, folder);
      onChange(asset.url);
      setUploadFeedback({
        type: "success",
        message:
          "Wklejone zdjęcie zostało dodane do galerii i podpięte do tego pola.",
      });
    } catch (pasteError) {
      setUploadFeedback({
        type: "error",
        message:
          pasteError instanceof Error
            ? pasteError.message
            : "Nie udało się wgrać obrazu ze schowka.",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={inputId}>{label}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setDialogOpen(true)}
            disabled={uploading}
          >
            {uploading ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Images className="h-3.5 w-3.5" />
            )}
            {uploading ? "Wgrywanie..." : "Galeria"}
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                onChange("");
                onClear?.();
              }}
              disabled={uploading}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Wyczyść
            </Button>
          ) : null}
        </div>
      </div>

      <Input
        id={inputId}
        type="url"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onPaste={(event) => void handlePaste(event)}
      />

      <p className="text-xs text-white/45">
        Wklej link albo naciśnij Ctrl+V z obrazem, aby automatycznie dodać go do
        galerii i podpiąć do pola.
      </p>

      {uploadFeedback ? (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            uploadFeedback.type === "success"
              ? "border-brand-yellow/20 bg-brand-yellow/10 text-white/85"
              : "border-brand-red/20 bg-brand-red/10 text-white/85"
          }`}
        >
          {uploadFeedback.message}
        </div>
      ) : null}

      {previewUrl ? (
        <div className="relative h-40 overflow-hidden rounded-xl border border-white/10 bg-[#151515]">
          <Image
            src={previewUrl}
            alt={label}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}

      {error ? <p className="text-xs text-brand-red">{error}</p> : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto border-white/10 bg-[#111111]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Wybierz plik z galerii
            </DialogTitle>
            <DialogDescription>
              Możesz wskazać istniejący zasób albo od razu wgrać nowy plik do
              folderu.
            </DialogDescription>
          </DialogHeader>

          <GalleryBrowser
            initialFolder={folder}
            selectable
            selectedUrl={value}
            onSelect={handleSelect}
            allowDelete={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
