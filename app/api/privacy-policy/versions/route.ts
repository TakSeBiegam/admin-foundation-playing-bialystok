import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sanitizeStatuteHtml } from "@/lib/statute-rich-text-server";

function normalizeBackendUrl(rawUrl: string) {
  return rawUrl.endsWith("/query")
    ? rawUrl
    : `${rawUrl.replace(/\/$/, "")}/query`;
}

const BACKEND_URL = normalizeBackendUrl(
  process.env.BACKEND_URL ?? "http://localhost:8080/query",
);
const BACKEND_BASE = BACKEND_URL.replace(/\/query$/, "");

type PrivacyPolicyVersionPayload = {
  id: string;
  content: string;
  summary?: string | null;
  authorId?: string | null;
  createdAt: string;
};

function buildSessionHeaders(session: Session | null) {
  const headers: Record<string, string> = {};

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

function sanitizePrivacyPolicyVersionsPayload(
  payload: unknown,
): PrivacyPolicyVersionPayload[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry) => {
    const typedEntry =
      entry && typeof entry === "object"
        ? (entry as Partial<PrivacyPolicyVersionPayload>)
        : {};

    return {
      id: typeof typedEntry.id === "string" ? typedEntry.id : "",
      content: sanitizeStatuteHtml(
        typeof typedEntry.content === "string" ? typedEntry.content : "",
      ),
      summary:
        typeof typedEntry.summary === "string" ? typedEntry.summary : null,
      authorId:
        typeof typedEntry.authorId === "string" ? typedEntry.authorId : null,
      createdAt:
        typeof typedEntry.createdAt === "string" ? typedEntry.createdAt : "",
    };
  });
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // forward query params (limit/offset)
    const url = new URL(`${BACKEND_BASE}/privacy-policy/versions`);
    const qp = new URL(request.url).searchParams;
    for (const [k, v] of qp.entries()) {
      url.searchParams.set(k, v);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: buildSessionHeaders(session),
      cache: "no-store",
    });

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json(sanitizePrivacyPolicyVersionsPayload(payload), {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Backend error" },
      { status: 502 },
    );
  }
}
