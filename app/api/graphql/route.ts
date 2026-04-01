import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function normalizeBackendUrl(rawUrl: string) {
  return rawUrl.endsWith("/query")
    ? rawUrl
    : `${rawUrl.replace(/\/$/, "")}/query`;
}

const BACKEND_URL = normalizeBackendUrl(
  process.env.BACKEND_URL ?? "http://localhost:8080/query",
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Attach server-side session user info to backend request headers
    const session: any = await getServerSession(authOptions as any);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.user?.id) headers["X-User-Id"] = session.user.id as string;
    if (session?.user?.role) headers["X-User-Role"] = session.user.role as string;

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await response.json();

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        errors: [
          {
            message:
              error instanceof Error
                ? error.message
                : "Nie udało się połączyć z backendem.",
          },
        ],
      },
      { status: 502 },
    );
  }
}