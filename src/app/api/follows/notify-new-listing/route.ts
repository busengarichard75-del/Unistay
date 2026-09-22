// src/app/api/follows/notify-new-listing/route.ts
//
// Fan-out: when a provider publishes a new listing, notify all their
// followers in-app. Called once from the publish success handler.
//
// Auth: Bearer token. Caller uid must match listing.ownerId.
// Server-side only — the follower list never reaches the provider's client.
//
// Batched writes (500/batch hard limit). Idempotency is caller's concern
// (only call once per new listing).

import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb, getAuthAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ADMIN_EMAIL = "busengarichard75@gmail.com";
const ALLOWED_KINDS = ["service", "product"] as const;
type Kind = (typeof ALLOWED_KINDS)[number];

// Firestore batch hard limit is 500. Keep a safe margin.
const BATCH_SIZE = 450;

async function getCaller(req: NextRequest): Promise<{ uid: string; email: string } | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await getAuthAdmin().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || "" };
  } catch {
    return null;
  }
}

function collectionFor(kind: Kind): "services" | "products" {
  return kind === "service" ? "services" : "products";
}

export async function POST(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let body: { kind?: string; listingId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const kind = body.kind as Kind | undefined;
    const listingId =
      typeof body.listingId === "string" && body.listingId.length <= 100
        ? body.listingId
        : "";

    if (!kind || !ALLOWED_KINDS.includes(kind)) {
      return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
    }
    if (!listingId) {
      return NextResponse.json({ error: "Invalid listingId." }, { status: 400 });
    }

    const adminDb = getFirestoreDb();

    // ── Confirm caller owns the listing ──
    const listingSnap = await adminDb
      .collection(collectionFor(kind))
      .doc(listingId)
      .get();

    if (!listingSnap.exists) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const listingData = listingSnap.data() as {
      ownerId?: string;
      title?: string;
      name?: string;
    };

    if (listingData.ownerId !== caller.uid) {
      return NextResponse.json({ error: "Not the listing owner." }, { status: 403 });
    }

    // ── Get all followers ──
    const followersSnap = await adminDb
      .collection("follows")
      .where("providerId", "==", caller.uid)
      .get();

    if (followersSnap.empty) {
      return NextResponse.json({ success: true, notified: 0 });
    }

    // ── Prepare notification payload ──
    const listingTitle =
      (kind === "service" ? listingData.title : listingData.name) || "New listing";

    const providerLabel =
      kind === "service" ? "service" : "product";

    // Deep link to the listing detail page.
    const link = kind === "service" ? `/services/${listingId}` : `/marketplace/${listingId}`;

    const now = Date.now();
    const followerIds: string[] = [];
    followersSnap.forEach((doc) => {
      const d = doc.data() as { followerId?: string };
      if (d.followerId && d.followerId !== caller.uid) {
        followerIds.push(d.followerId);
      }
    });

    if (followerIds.length === 0) {
      return NextResponse.json({ success: true, notified: 0 });
    }

    // ── Batch write notifications (500/batch limit) ──
    let notified = 0;
    for (let i = 0; i < followerIds.length; i += BATCH_SIZE) {
      const chunk = followerIds.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();
      const notificationsRef = adminDb.collection("notifications");

      for (const uid of chunk) {
        const notifRef = notificationsRef.doc();
        batch.set(notifRef, {
          userId: uid,
          title: `New ${providerLabel} from a shop you follow`,
          body: listingTitle,
          type: "follow_new_listing",
          read: false,
          createdAt: now,
          link,
          metadata: {
            kind,
            listingId,
            providerId: caller.uid,
          },
        });
        notified += 1;
      }

      await batch.commit();
    }

    return NextResponse.json({ success: true, notified });
  } catch (err) {
    console.error("notify-new-listing error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}