import { NextResponse } from "next/server";

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

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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