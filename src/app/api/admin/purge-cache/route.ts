// src/app/api/admin/purge-cache/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "busengarichard75@gmail.com";

const REVALIDATE_PATHS = [
  "/",
  "/marketplace",
  "/services",
  "/library",
  "/map",
  "/saved",
  "/help",
  "/why-peza",
];

export async function POST(req: NextRequest) {
  try {
    // ─── Verify the caller is the admin ───
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    const decoded = await getAuthAdmin().verifyIdToken(idToken);

    if (decoded.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ─── Revalidate Next.js server cache for key pages ───
    for (const path of REVALIDATE_PATHS) {
      try {
        revalidatePath(path);
      } catch (err) {
        console.warn(`revalidatePath failed for ${path}:`, err);
      }
    }

    // ─── Optional: also purge Vercel CDN if token is set ───
    let cdnPurged = false;
    const vercelToken = process.env.VERCEL_API_TOKEN;
    if (vercelToken) {
      try {
        const res = await fetch("https://api.vercel.com/v1/edge-cache/purge", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        cdnPurged = res.ok;
      } catch (err) {
        console.warn("Vercel CDN purge failed (non-critical):", err);
      }
    }

    return NextResponse.json({
      success: true,
      revalidated: REVALIDATE_PATHS.length,
      cdnPurged,
      message: cdnPurged
        ? "Revalidated + CDN purged"
        : "Revalidated (CDN purge skipped — no VERCEL_API_TOKEN set)",
    });
  } catch (err) {
    console.error("Purge failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}