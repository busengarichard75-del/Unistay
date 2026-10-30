// src/lib/trackListing.ts

type ListingKind = "service" | "product";
type CounterField = "views" | "whatsappClicks";

const VISITOR_KEY = "peza_visitor_id";

/**
 * Gets or creates a permanent, anonymous device ID.
 * This acts as the user's "fingerprint" to prevent fake views.
 */
function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `v_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

/**
 * Fire-and-forget listing counter.
 */
export async function trackListing(
  kind: ListingKind,
  id: string,
  field: CounterField,
  userId?: string
): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId();

    await fetch("/api/track-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, field, userId, visitorId }),
    });
  } catch {
    // silent — tracking is best-effort
  }
}