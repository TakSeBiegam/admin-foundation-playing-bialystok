import type { GalleryFolder } from "@/lib/types";

const PRIVATE_BLOB_HOST_FRAGMENT = ".private.blob.vercel-storage.com";
const GALLERY_PREFIX = "gallery/";

export const GALLERY_FOLDER_OPTIONS: Array<{
  value: GalleryFolder;
  label: string;
}> = [
  { value: "all", label: "Wszystkie" },
  { value: "events", label: "Wydarzenia" },
  { value: "partners", label: "Partnerzy" },
  { value: "offer", label: "Oferta" },
  { value: "board-games", label: "Katalog" },
  { value: "general", label: "Ogólne" },
];

export function getGalleryPrefix(folder: GalleryFolder) {
  if (folder === "all") {
    return GALLERY_PREFIX;
  }

  return `${GALLERY_PREFIX}${folder}/`;
}

export function isPrivateBlobUrl(value?: string | null) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.hostname.includes(PRIVATE_BLOB_HOST_FRAGMENT);
  } catch {
    return false;
  }
}

export function extractGalleryPathname(source?: string | null) {
  const value = source?.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith(GALLERY_PREFIX)) {
    return value;
  }

  if (!isPrivateBlobUrl(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    const pathname = url.pathname.replace(/^\//, "");
    return pathname.startsWith(GALLERY_PREFIX) ? pathname : null;
  } catch {
    return null;
  }
}

export function resolveMediaUrl(source?: string | null) {
  const value = source?.trim();
  if (!value) {
    return undefined;
  }

  if (isPrivateBlobUrl(value)) {
    return `/api/media?source=${encodeURIComponent(value)}`;
  }

  return value;
}