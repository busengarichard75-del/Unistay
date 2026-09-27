// src/types/library.ts

/**
 * Library — link-out study materials directory.
 * Peza does NOT host files. Every entry points to a Google Drive link.
 * Isolated mini-feature — nothing else in the app depends on this.
 *
 * 🔒 SECURITY: driveLink is NOT on LibraryEntryPublic. It lives in
 * `libraryPrivate/{id}` (Firestore rules restrict reads to uploader or
 * unlocked users). See firestore.rules for the exact rules.
 */

export type LibraryCategory =
  | "past_papers"
  | "notes"
  | "summaries"
  | "guides";

export type LibraryStatus = "pending" | "approved" | "rejected" | "hidden";

// ─────────────────────────────────────────────────────────
// CHALLENGES — pick one to unlock a material
// ─────────────────────────────────────────────────────────
export type LibraryChallenge = "share" | "follow";

export const LIBRARY_CHALLENGES: {
  id: LibraryChallenge;
  label: string;
  hint: string;
  icon: string;
}[] = [
  {
    id: "share",
    label: "Share Peza",
    hint: "Share Peza with a classmate",
    icon: "📤",
  },
  {
    id: "follow",
    label: "Follow Peza",
    hint: "Follow our official Facebook page",
    icon: "⭐",
  },
];

// ─────────────────────────────────────────────────────────
// PUBLIC ENTRY — what clients receive from Firestore.
// Does NOT contain driveLink.
// ─────────────────────────────────────────────────────────
export interface LibraryEntryPublic {
  id: string;

  // Content
  title: string;
  description: string;
  category: LibraryCategory;

  // Academic metadata
  universityId: string;
  courseCode?: string;
  year?: string;
  semester?: string;

  // Optional cover image (Cloudinary)
  coverImageUrl?: string;

  // Uploader
  uploaderId: string;
  uploaderName: string;

  // Moderation
  status: LibraryStatus;
  adminHidden?: boolean;
  adminHiddenReason?: string | null;

  // Analytics
  views: number;
  saves: number;
  reports: number;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Legacy alias — kept for backward compatibility with existing imports.
 * After the library migration, `driveLink` is undefined on public reads
 * (it now lives in libraryPrivate). New code should use LibraryEntryPublic.
 *
 * @deprecated Use LibraryEntryPublic for reads.
 */
export interface LibraryEntry extends LibraryEntryPublic {
  /** @deprecated Removed from public reads during the library security migration. */
  driveLink?: string;
}

// ─────────────────────────────────────────────────────────
// UNLOCK RECORD — one per (user, entry) pair.
// Doc ID: {userId}_{entryId}. Read-only from the client.
// ─────────────────────────────────────────────────────────
export interface LibraryUnlock {
  userId: string;
  entryId: string;
  challenge: LibraryChallenge;
  completedAt: number;
}

// ─────────────────────────────────────────────────────────
// CATEGORIES — used for tabs/filters
// ─────────────────────────────────────────────────────────
export const LIBRARY_CATEGORIES: {
  id: LibraryCategory;
  label: string;
  icon: string;
  hint: string;
}[] = [
  {
    id: "past_papers",
    label: "Past Papers",
    icon: "📝",
    hint: "Exam papers from previous years",
  },
  {
    id: "notes",
    label: "Notes",
    icon: "📓",
    hint: "Lecture notes & class summaries",
  },
  {
    id: "summaries",
    label: "Summaries",
    icon: "📊",
    hint: "Condensed topic overviews",
  },
  {
    id: "guides",
    label: "Study Guides",
    icon: "📖",
    hint: "How-to guides & revision plans",
  },
];

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

export function getLibraryCategoryMeta(id: LibraryCategory) {
  return LIBRARY_CATEGORIES.find((c) => c.id === id);
}

export function getLibraryCategoryLabel(id: LibraryCategory): string {
  return getLibraryCategoryMeta(id)?.label || id;
}

export function getLibraryCategoryIcon(id: LibraryCategory): string {
  return getLibraryCategoryMeta(id)?.icon || "📚";
}

/**
 * Extract the Google Drive file ID from any common Drive URL format.
 * Returns null if the URL doesn't look like a Drive link.
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (dMatch) return dMatch[1];

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (idMatch) return idMatch[1];

  return null;
}

/**
 * Build a Google Drive embeddable preview URL from a share link.
 * Returns null if the file ID can't be extracted.
 */
export function buildDrivePreviewUrl(url: string): string | null {
  const id = extractDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}

/**
 * Validate that a URL is a Google Drive link.
 */
export function isGoogleDriveUrl(url: string): boolean {
  return extractDriveFileId(url) !== null;
}