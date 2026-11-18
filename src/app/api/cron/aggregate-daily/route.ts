// src/app/api/cron/aggregate-daily/route.ts
import { NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { computeDailyStats } from "@/services/statsAggregator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);

    const db = getFirestoreDb();
    const stats = await computeDailyStats(db, dateStr);

    await db.collection("stats_daily").doc(dateStr).set({
      ...stats,
      computedAt: Date.now(),
    });

    return NextResponse.json({ ok: true, date: dateStr, stats });
  } catch (err) {
    console.error("Cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}