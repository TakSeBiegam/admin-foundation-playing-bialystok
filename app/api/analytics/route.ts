import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = (await getServerSession(authOptions)) as {
    user?: Record<string, unknown>;
  } | null;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const sp = url.searchParams;
    const startDate = sp.get("startDate") || undefined;
    const endDate = sp.get("endDate") || undefined;
    const topPagesLimit = sp.has("topPagesLimit")
      ? Math.max(1, Math.min(100, Number(sp.get("topPagesLimit") || "6")))
      : undefined;

    const data = await getAnalyticsSummary({ startDate, endDate, topPagesLimit });
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}