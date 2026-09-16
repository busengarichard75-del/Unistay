// src/lib/trackListing.ts

type ListingKind = "service" | "product";
type CounterField = "views" | "whatsappClicks";

export async function trackListing(
  kind: ListingKind,
  id: string,
  field: CounterField
): Promise<void> {
  try {
    await fetch("/api/track-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, field }),
    });
  } catch {
    // silent — tracking is best-effort
  }
}