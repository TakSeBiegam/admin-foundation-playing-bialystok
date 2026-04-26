import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeStatuteHtml } from "@/lib/statute-rich-text-server";

function normalizeBackendUrl(rawUrl: string) {
  return rawUrl.endsWith("/query") ? rawUrl : `${rawUrl.replace(/\/$/, "")}/query`;
}

const BACKEND_URL = normalizeBackendUrl(process.env.BACKEND_URL ?? "http://localhost:8080/query");
const BACKEND_BASE = BACKEND_URL.replace(/\/query$/, "");

type StatutePayload = {
  id: string;
  content: string;
  updatedAt: string;
};

type StatuteMutationBody = {
  content?: unknown;
  summary?: unknown;
};

function buildSessionHeaders(session: Session | null, includeJson = false) {
  const headers: Record<string, string> = includeJson
    ? { "Content-Type": "application/json" }
    : {};

  if (session?.user?.id) headers["X-User-Id"] = session.user.id;
  if (session?.user?.role) headers["X-User-Role"] = session.user.role;
  if (session?.user?.email) headers["X-User-Email"] = session.user.email;
  if (session?.user?.name) headers["X-User-Name"] = session.user.name;

  return headers;
}

async function readResponsePayload(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

function sanitizeStatutePayload(payload: unknown): StatutePayload {
  if (!payload || typeof payload !== "object") {
    return { id: "", content: "", updatedAt: "" };
  }

  const typedPayload = payload as Partial<StatutePayload>;

  return {
    id: typeof typedPayload.id === "string" ? typedPayload.id : "",
    content: sanitizeStatuteHtml(
      typeof typedPayload.content === "string" ? typedPayload.content : "",
    ),
    updatedAt:
      typeof typedPayload.updatedAt === "string" ? typedPayload.updatedAt : "",
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const response = await fetch(`${BACKEND_BASE}/statute`, {
      method: "GET",
      headers: buildSessionHeaders(session),
      cache: "no-store",
    });

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json(sanitizeStatutePayload(payload), {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message ?? "Backend error" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StatuteMutationBody;
    const session = await getServerSession(authOptions);

    const normalizedBody = {
      content: sanitizeStatuteHtml(
        typeof body.content === "string" ? body.content : "",
      ),
      summary:
        typeof body.summary === "string" && body.summary.trim().length > 0
          ? body.summary.trim()
          : undefined,
    };

    const response = await fetch(`${BACKEND_BASE}/statute`, {
      method: "POST",
      headers: buildSessionHeaders(session, true),
      body: JSON.stringify(normalizedBody),
      cache: "no-store",
    });

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json(sanitizeStatutePayload(payload), {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message ?? "Backend error" }, { status: 502 });
  }
}
