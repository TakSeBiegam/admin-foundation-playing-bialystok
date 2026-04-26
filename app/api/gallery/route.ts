import { del, list, put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  extractGalleryPathname,
  getGalleryPrefix,
  GALLERY_FOLDER_OPTIONS,
} from "@/lib/media";
import type { GalleryAsset, GalleryFolder } from "@/lib/types";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

const MAX_LIST_LIMIT = 36;

function isGalleryFolder(value: string | null): value is GalleryFolder {
  return GALLERY_FOLDER_OPTIONS.some((option) => option.value === value);
}

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim().toLowerCase();
  return trimmed
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "asset";
}

function mapAsset(url: string, pathname: string, uploadedAt: Date, size: number, contentType?: string | null): GalleryAsset {
  return {
    url,
    pathname,
    previewUrl: `/api/media?source=${encodeURIComponent(url)}`,
    contentType: contentType || null,
    uploadedAt: uploadedAt.toISOString(),
    size,
  };
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const folderParam = request.nextUrl.searchParams.get("folder");
  const folder = isGalleryFolder(folderParam) ? folderParam : "all";
  const limitParam = Number.parseInt(request.nextUrl.searchParams.get("limit") || "24", 10);
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(limitParam, MAX_LIST_LIMIT))
    : 24;

  const result = await list({
    prefix: getGalleryPrefix(folder),
    cursor: request.nextUrl.searchParams.get("cursor") || undefined,
    limit,
  });

  const items = result.blobs
    .map((blob) => mapAsset(blob.url, blob.pathname, blob.uploadedAt, blob.size))
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));

  return NextResponse.json({
    items,
    hasMore: result.hasMore,
    nextCursor: result.cursor,
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folderValue = formData.get("folder");
  const folder = isGalleryFolder(typeof folderValue === "string" ? folderValue : null)
    ? (folderValue as GalleryFolder)
    : "general";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nie znaleziono pliku." }, { status: 400 });
  }

  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Dozwolone są tylko pliki graficzne." },
      { status: 400 },
    );
  }

  const pathname = `${getGalleryPrefix(folder)}${Date.now()}-${sanitizeFileName(file.name)}`;
  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type || undefined,
  });

  return NextResponse.json(
    mapAsset(blob.url, blob.pathname, new Date(), file.size, file.type || null),
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const source = request.nextUrl.searchParams.get("source");
  const pathname = extractGalleryPathname(source);

  if (!pathname) {
    return NextResponse.json({ error: "Niepoprawny zasób." }, { status: 400 });
  }

  await del(pathname);
  return NextResponse.json({ ok: true });
}