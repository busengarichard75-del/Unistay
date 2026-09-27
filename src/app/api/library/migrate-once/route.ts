// src/app/api/library/migrate-once/route.ts
//
// ⚠️ ONE-TIME MIGRATION ROUTE — DELETE AFTER USE.

import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIGRATE_SECRET = "peza-lib-mig-2026-X9K4R7mQ2vZ8";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    const cleanup = url.searchParams.get("cleanup") === "1";

    if (secret !== MIGRATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const adminDb = getFirestoreDb();
    const snap = await adminDb.collection("library").get();

    let migrated = 0;
    let skipped = 0;
    let cleanedUp = 0;
    let missingLink = 0;

    for (const doc of snap.docs) {
      const data = doc.data() as {
        driveLink?: string;
        updatedAt?: number;
        createdAt?: number;
      };
      const entryId = doc.id;
      const driveLink = data.driveLink;

      if (!driveLink || typeof driveLink !== "string" || driveLink.length < 4) {
        missingLink += 1;
        if (cleanup && "driveLink" in data) {
          try {
            await adminDb.collection("library").doc(entryId).update({
              driveLink: FieldValue.delete(),
            });
            cleanedUp += 1;
          } catch (err) {
            console.warn(`Cleanup failed for ${entryId}:`, err);
          }
        }
        continue;
      }

      const privateRef = adminDb.collection("libraryPrivate").doc(entryId);
      const existing = await privateRef.get();

      if (existing.exists) {
        skipped += 1;
      } else {
        try {
          await privateRef.set({
            driveLink,
            updatedAt: data.updatedAt || data.createdAt || Date.now(),
          });
          migrated += 1;
        } catch (err) {
          console.error(`Migration failed for ${entryId}:`, err);
          continue;
        }
      }

      if (cleanup) {
        try {
          await adminDb.collection("library").doc(entryId).update({
            driveLink: FieldValue.delete(),
          });
          cleanedUp += 1;
        } catch (err) {
          console.warn(`Cleanup failed for ${entryId}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      cleanup,
      total: snap.size,
      migrated,
      skipped,
      cleanedUp,
      missingLink,
    });
  } catch (err) {
    console.error("migrate-once error:", err);
    return NextResponse.json(
      {
        error: "Server error.",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}