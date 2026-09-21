// src/lib/analyticsEvents.ts

/**
 * Peza Analytics — Structured event logger.
 *
 * One function (`trackEvent`) that every part of the app can call.
 * It enriches each event with identity + context, then fires it to
 * Firestore in the background. Never throws. Never blocks UI.
 *
 * Firestore doc shape (collection: "analytics_events"):
 * {
 *   visitorId, sessionId, userId, role,
 *   firstSeenAt,            ← for New vs Returning split
 *   vertical, source,
 *   action, targetId,
 *   path, referrer,
 *   meta: {...},
 *   timestamp
 * }
 *
 * DESIGN PRINCIPLE: the event log is the source of truth.
 * Every metric in the admin dashboard is derived from these raw events.
 * If an event isn't logged here, it doesn't exist for analytics purposes.
 * Therefore: log generously at every meaningful action.
 */

import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAnalyticsContext, AnalyticsVertical } from "./analyticsIdentity";

// ─── Event actions (the full catalogue) ─────────────────────
export type AnalyticsAction =
  // ── Page-level ──
  | "page_view"
  | "search"

  // ── Accommodation ──
  | "view_property"
  | "booking_request"
  | "booking_approved"
  | "booking_confirmed"

  // ── Services ──
  | "view_service"
  | "service_whatsapp_click"

  // ── Marketplace ──
  | "view_product"
  | "product_whatsapp_click"

  // ── Library ──
  | "view_library_entry"
  | "download_library_entry"
  | "library_share"

  // ── Provider / Shop ──
  | "view_provider_shop"
  | "provider_signup"
  | "listing_created"
  | "boost_requested"

  // ── General ──
  | "wishlist_add"
  | "wishlist_remove"
  | "share_click"
  | "report_submitted"
  | "user_signup"
  | "user_login";

// ─── Context passed in by the caller ────────────────────────
export interface TrackEventInput {
  /** What happened — a value from AnalyticsAction */
  action: AnalyticsAction;

  /** Which vertical it belongs to. Falls back to path-derived value. */
  vertical?: AnalyticsVertical;

  /** ID of the object acted upon (property / service / product / library entry) */
  targetId?: string;

  /**
   * Optional extra data — e.g., category, price, search term.
   * ⚠️ Do NOT pass PII (names, emails, phones, addresses).
   *    This collection is admin-read only, but keep it clean anyway.
   */
  meta?: Record<string, unknown>;
}

// ─── Role fallback (never assume) ───────────────────────────
type EventRole = "guest" | "student" | "landlord" | "service_provider" | "admin";

function roleFromUser(user: any): EventRole {
  if (!user) return "guest";
  const r = user.role;
  if (r === "student" || r === "landlord" || r === "service_provider") return r;
  return "guest";
}

// ─── THE MAIN API ───────────────────────────────────────────
/**
 * Log an analytics event. Fire-and-forget.
 *
 * @example
 *   trackEvent({ action: "view_property", targetId: property.id }, user);
 *   trackEvent({ action: "service_whatsapp_click", targetId: service.id }, user);
 *   trackEvent({ action: "search", meta: { keyword: "barber" } }, user);
 *
 * Second argument is optional:
 *   - pass the current auth user → event is attributed to that account
 *   - omit it → event is treated as an anonymous guest interaction
 */
export function trackEvent(
  input: TrackEventInput,
  user?: { uid?: string | null; role?: string | null } | null
): void {
  // Guard 1: browser only
  if (typeof window === "undefined") return;

  // Guard 2: Firestore must be initialised
  if (!db) return;

  try {
    const ctx = getAnalyticsContext();
    const role = roleFromUser(user ?? null);
    const path = window.location.pathname;
    const referrer =
      typeof document !== "undefined" ? document.referrer || null : null;

    // ─── Payload (flat, small, easy to query) ───
    const payload = {
      // identity
      visitorId: ctx.visitorId,
      sessionId: ctx.sessionId,
      userId: user?.uid || null,
      role,

      // ⚠️ firstSeenAt is the KEY to honest New vs Returning counts.
      // It travels with every event so no matter which events survive
      // the 1,000-doc read limit, we can still recover who was new.
      firstSeenAt: ctx.firstSeenAt,

      // context
      vertical: input.vertical || ctx.vertical,
      source: ctx.source,

      // the actual event
      action: input.action,
      targetId: input.targetId || null,

      // page context
      path,
      referrer,

      // free-form extras (small — never log PII here)
      meta: input.meta || null,

      // time
      timestamp: Date.now(),
    };

    // ─── Fire-and-forget write ───
    // Deliberately NOT awaited — analytics must never slow the UI
    // and must never surface an error to the user.
    addDoc(collection(db, "analytics_events"), payload).catch(() => {
      // silent — a dropped analytics event is never worth breaking the app
    });
  } catch {
    // silent — analytics failures are invisible to users by design
  }
}

// ─── Convenience wrappers ───────────────────────────────────
/**
 * Log a page view. Called by AnalyticsTracker on every route change.
 * Dedup happens at the caller (StrictMode-safe).
 */
export function trackPageView(
  pathname: string,
  user?: { uid?: string | null; role?: string | null } | null
): void {
  trackEvent({ action: "page_view" }, user);
}

/**
 * Log a search performed anywhere on Peza.
 * Auto-trims and caps length so we never store huge strings.
 */
export function trackSearch(
  keyword: string,
  context: { vertical?: AnalyticsVertical } = {},
  user?: { uid?: string | null; role?: string | null } | null
): void {
  const trimmed = keyword.trim();
  if (!trimmed) return;
  trackEvent(
    {
      action: "search",
      vertical: context.vertical,
      meta: { keyword: trimmed.slice(0, 60) },
    },
    user
  );
}

/**
 * Log a detail view (property / service / product / library entry).
 * Shorthand so call sites stay short and consistent.
 */
export function trackDetailView(
  kind: "property" | "service" | "product" | "library",
  targetId: string,
  user?: { uid?: string | null; role?: string | null } | null
): void {
  const map = {
    property: "view_property",
    service: "view_service",
    product: "view_product",
    library: "view_library_entry",
  } as const;

  trackEvent({ action: map[kind], targetId }, user);
}

/**
 * Log a WhatsApp contact click from any listing.
 * These are the highest-signal "real interest" events on Peza.
 */
export function trackWhatsAppClick(
  kind: "service" | "product",
  targetId: string,
  user?: { uid?: string | null; role?: string | null } | null
): void {
  trackEvent(
    {
      action: kind === "service" ? "service_whatsapp_click" : "product_whatsapp_click",
      targetId,
    },
    user
  );
}