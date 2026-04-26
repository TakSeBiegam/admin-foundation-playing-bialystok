import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdvancedAnalytics } from "@/lib/analytics";

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
    const devicesLimit = sp.has("devicesLimit")
      ? Math.max(1, Math.min(100, Number(sp.get("devicesLimit") || "10")))
      : undefined;
    const countriesLimit = sp.has("countriesLimit")
      ? Math.max(1, Math.min(200, Number(sp.get("countriesLimit") || "10")))
      : undefined;
    const referrersLimit = sp.has("referrersLimit")
      ? Math.max(1, Math.min(200, Number(sp.get("referrersLimit") || "10")))
      : undefined;

    const data = await getAdvancedAnalytics({
      startDate,
      endDate,
      topPagesLimit,
      devicesLimit,
      countriesLimit,
      referrersLimit,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
