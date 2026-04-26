import { get } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { extractGalleryPathname } from "@/lib/media";

const BROWSER_CACHE_CONTROL = "private, max-age=300, stale-while-revalidate=86400";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const source = request.nextUrl.searchParams.get("source");
  const pathname = extractGalleryPathname(source);

  if (!pathname) {
    return NextResponse.json({ error: "Niepoprawne źródło pliku." }, { status: 400 });
  }

  const result = await get(pathname, {
    access: "private",
    ifNoneMatch: request.headers.get("if-none-match") || undefined,
  });

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (result.statusCode === 304) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        "Cache-Control": BROWSER_CACHE_CONTROL,
        ETag: result.blob.etag,
      },
    });
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      "Cache-Control": BROWSER_CACHE_CONTROL,
      "Content-Disposition": result.blob.contentDisposition,
      "Content-Type": result.blob.contentType || "application/octet-stream",
      ETag: result.blob.etag,
    },
  });
}