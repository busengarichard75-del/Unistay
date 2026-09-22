// src/lib/trackListing.ts

type ListingKind = "service" | "product";
type CounterField = "views" | "whatsappClicks";

/**
 * Fire-and-forget listing counter.
 *
 * When `userId` is provided alongside a `whatsappClicks` event, the API
 * route also records a per-user WhatsApp click (used as the verified-review
 * gate). Guests never pass userId — the WhatsApp buttons gate them first.
 */
export async function trackListing(
  kind: ListingKind,
  id: string,
  field: CounterField,
  userId?: string
): Promise<void> {
  try {
    await fetch("/api/track-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, field, userId }),
    });
  } catch {
    // silent — tracking is best-effort
  }
}