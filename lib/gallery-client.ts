import type { GalleryAsset, GalleryFolder } from "@/lib/types";

type JsonErrorPayload = {
  error?: string;
};

const mimeExtensionMap: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export async function readGalleryJson<T>(response: Response) {
  const payload = (await response.json()) as T & JsonErrorPayload;
  if (!response.ok) {
    throw new Error(payload.error || "Operacja zakończyła się błędem.");
  }

  return payload;
}

function normalizeUploadFolder(folder: GalleryFolder): GalleryFolder {
  return folder === "all" ? "general" : folder;
}

export function ensureNamedImageFile(
  file: File,
  fallbackBaseName = "clipboard-image",
) {
  if (file.name.trim()) {
    return file;
  }

  const extension = mimeExtensionMap[file.type] ?? "png";
  return new File([file], `${fallbackBaseName}-${Date.now()}.${extension}`, {
    type: file.type || "image/png",
    lastModified: Date.now(),
  });
}

export async function uploadGalleryFile(file: File, folder: GalleryFolder) {
  const formData = new FormData();
  formData.set("file", ensureNamedImageFile(file));
  formData.set("folder", normalizeUploadFolder(folder));

  const response = await fetch("/api/gallery", {
    method: "POST",
    body: formData,
  });

  return readGalleryJson<GalleryAsset>(response);
}

export async function uploadGalleryFiles(
  files: Iterable<File>,
  folder: GalleryFolder,
) {
  const uploadedAssets: GalleryAsset[] = [];

  for (const file of Array.from(files)) {
    uploadedAssets.push(await uploadGalleryFile(file, folder));
  }

  return uploadedAssets;
}