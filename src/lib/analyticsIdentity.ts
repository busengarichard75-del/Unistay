// src/lib/analyticsIdentity.ts

/**
 * Peza Analytics — Identity & Context layer.
 *
 * Answers four questions on every interaction:
 *   1. WHO   → visitorId (persistent) + sessionId (30-min window) + userId (if logged in)
 *   2. WHERE → vertical (accommodation / services / marketplace / library / ...)
 *   3. FROM  → source (facebook / google / whatsapp / direct / ...)
 *   4. WHEN  → timestamp + firstSeenAt (for New vs Returning)
 *
 * All functions are SSR-safe and never throw.
 * Zero dependencies. Zero impact on the rest of the app.
 *
 * ⚠️ THE HONEST TRUTH ABOUT "UNIQUE VISITORS":
 *    - Anonymous: we identify visitors by a persistent localStorage id.
 *      If the user clears cookies / uses incognito / switches devices,
 *      they will look "new" again. This is a fundamental limit of ALL
 *      anonymous web analytics — nobody can do better without login.
 *    - Logged in: we use Firebase uid, which is exact.
 *    - The dashboard labels anonymous counts as "estimated" so nobody is
 *      ever misled about precision.
 */

// ─── Storage keys ───────────────────────────────────────────
const VISITOR_KEY = "peza_visitor_id";
const FIRST_SEEN_KEY = "peza_first_seen";
const SESSION_KEY = "peza_session_id";
const SESSION_LAST_KEY = "peza_session_last_active";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ─── Types ──────────────────────────────────────────────────
export type AnalyticsVertical =
  | "accommodation"
  | "services"
  | "marketplace"
  | "library"
  | "provider"
  | "dashboard"
  | "admin"
  | "auth"
  | "other";

export type AnalyticsSource =
  | "facebook"
  | "instagram"
  | "google"
  | "whatsapp"
  | "twitter"
  | "tiktok"
  | "direct"
  | "referral"
  | "other";

export interface AnalyticsContext {
  visitorId: string;
  sessionId: string;
  source: AnalyticsSource;
  vertical: AnalyticsVertical;
  firstSeenAt: number;
}

// ─── Utilities ──────────────────────────────────────────────
function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${rand}_${ts}`;
}

// ─── 1. VISITOR ID (persistent per device) ──────────────────
/**
 * The persistent id for this browser. Same id is returned on every call
 * until the user clears localStorage. This is our best-effort anonymous
 * identity — it's how we count "20 real people" instead of "900 views".
 */
export function getVisitorId(): string {
  const store = safeLocalStorage();
  if (!store) return "ssr_visitor";

  let id = store.getItem(VISITOR_KEY);
  if (!id) {
    id = generateId("v");
    try {
      store.setItem(VISITOR_KEY, id);
    } catch {
      // storage full or blocked — still return a working id for this request
    }
  }
  return id;
}

// ─── 2. FIRST SEEN (for New vs Returning split) ─────────────
/**
 * Returns the timestamp when this browser first ever visited Peza.
 * Written ONCE and never updated. This is what lets us honestly split
 * "12 new people" from "8 who came back" — the single most important
 * number for knowing if Peza is genuinely growing.
 */
export function getFirstSeenAt(): number {
  const store = safeLocalStorage();
  if (!store) return Date.now();

  const stored = store.getItem(FIRST_SEEN_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  const now = Date.now();
  try {
    store.setItem(FIRST_SEEN_KEY, String(now));
  } catch {
    // silent
  }
  return now;
}

// ─── 3. SESSION ID (30-min inactivity window) ───────────────
/**
 * A "session" = a period of activity. New session whenever the last
 * activity was more than 30 minutes ago.
 *
 * WHY THIS MATTERS FOR HONEST NUMBERS:
 *   - 20 people visiting 45 times each = 20 unique visitors, ~900 sessions
 *   - The dashboard shows both so you can never mistake "900" for "900 people"
 */
export function getSessionId(): string {
  const store = safeLocalStorage();
  if (!store) return "ssr_session";

  const now = Date.now();
  const existingId = store.getItem(SESSION_KEY);
  const lastActive = Number(store.getItem(SESSION_LAST_KEY) || 0);
  const isFresh = !existingId || !lastActive || now - lastActive > SESSION_TIMEOUT_MS;

  if (isFresh) {
    const newId = generateId("s");
    try {
      store.setItem(SESSION_KEY, newId);
      store.setItem(SESSION_LAST_KEY, String(now));
    } catch {
      // silent
    }
    return newId;
  }

  // Same session — refresh the last-active marker
  try {
    store.setItem(SESSION_LAST_KEY, String(now));
  } catch {
    // silent
  }
  return existingId;
}

// ─── 4. VERTICAL DETECTION (from pathname) ──────────────────
/**
 * Maps a URL pathname to the Peza vertical it belongs to.
 * Used everywhere so we can always tell which product area a metric
 * came from — so at a glance you know whether Accommodation, Services,
 * Marketplace, or Library is actually being used.
 */
export function getVertical(pathname: string | null | undefined): AnalyticsVertical {
  if (!pathname) return "other";
  const p = pathname.toLowerCase();

  if (p === "/" || p.startsWith("/property") || p.startsWith("/find-my-best-house")) {
    return "accommodation";
  }
  if (p.startsWith("/services") || p.startsWith("/why-peza")) {
    return "services";
  }
  if (p.startsWith("/marketplace")) {
    return "marketplace";
  }
  if (p.startsWith("/library")) {
    return "library";
  }
  if (p.startsWith("/provider")) {
    return "provider";
  }
  if (p.startsWith("/dashboard")) {
    return "dashboard";
  }
  if (p.startsWith("/admin")) {
    return "admin";
  }
  if (p.startsWith("/login") || p.startsWith("/signup") || p.startsWith("/forgot-password")) {
    return "auth";
  }
  return "other";
}

// ─── 5. SOURCE DETECTION (utm → referrer → direct) ──────────
/**
 * Best-effort answer to "where did this visitor come from?"
 * Prefers explicit UTM params over the raw referrer header.
 *
 * This is what lets you prove (after you start running ads) exactly
 * how many REAL people Facebook / Google / WhatsApp delivered — not just
 * how many clicks.
 */
export function getSource(): AnalyticsSource {
  if (typeof window === "undefined") return "other";

  // 1) Explicit UTM params win
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = (params.get("utm_source") || "").toLowerCase();
    if (utm) {
      if (utm.includes("facebook") || utm === "fb") return "facebook";
      if (utm.includes("instagram") || utm === "ig") return "instagram";
      if (utm.includes("google")) return "google";
      if (utm.includes("whatsapp") || utm === "wa") return "whatsapp";
      if (utm.includes("twitter") || utm === "x") return "twitter";
      if (utm.includes("tiktok")) return "tiktok";
      return "other";
    }
  } catch {
    // silent
  }

  // 2) Referrer header fallback
  const ref = (typeof document !== "undefined" ? document.referrer || "" : "").toLowerCase();
  if (!ref) return "direct";
  if (ref.includes("facebook.com")) return "facebook";
  if (ref.includes("instagram.com")) return "instagram";
  if (ref.includes("google.")) return "google";
  if (ref.includes("wa.me") || ref.includes("whatsapp.com")) return "whatsapp";
  if (ref.includes("twitter.com") || ref.includes("x.com")) return "twitter";
  if (ref.includes("tiktok.com")) return "tiktok";

  // 3) Same-origin navigation → treat as direct (a user clicking within Peza)
  try {
    const refOrigin = new URL(ref).origin;
    if (refOrigin === window.location.origin) return "direct";
  } catch {
    // fall through
  }

  return "referral";
}

// ─── Bundle helper ──────────────────────────────────────────
/**
 * One-liner to grab everything at once. Used by trackEvent().
 */
export function getAnalyticsContext(pathname?: string): AnalyticsContext {
  return {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    source: getSource(),
    vertical: getVertical(
      pathname ?? (typeof window !== "undefined" ? window.location.pathname : null)
    ),
    firstSeenAt: getFirstSeenAt(),
  };
}