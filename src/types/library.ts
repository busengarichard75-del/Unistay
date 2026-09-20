// src/types/library.ts

/**
 * Library — link-out study materials directory.
 * Peza does NOT host files. Every entry points to a Google Drive link.
 * Isolated mini-feature — nothing else in the app depends on this.
 */

export type LibraryCategory =
  | "past_papers"
  | "notes"
  | "summaries"
  | "guides";

export type LibraryStatus = "pending" | "approved" | "rejected" | "hidden";

export interface LibraryEntry {
  id: string;

  // ─── Content ───
  title: string;
  description: string;
  category: LibraryCategory;

  // ─── Academic metadata ───
  universityId: string;
  courseCode?: string;    // e.g., "CS101"
  year?: string;          // e.g., "2024"
  semester?: string;      // e.g., "1" | "2"

  // ─── The link (Google Drive share URL) ───
  driveLink: string;

  // ─── Optional cover image (Cloudinary, small) ───
  coverImageUrl?: string;

  // ─── Uploader ───
  uploaderId: string;
  uploaderName: string;

  // ─── Moderation ───
  status: LibraryStatus;
  adminHidden?: boolean;
  adminHiddenReason?: string | null;

  // ─── Analytics ───
  views: number;
  saves: number;
  reports: number;

  // ─── Timestamps ───
  createdAt: number;
  updatedAt: number;
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
 *
 * Supported:
 *   https://drive.google.com/file/d/{ID}/view?usp=sharing
 *   https://drive.google.com/open?id={ID}
 *   https://drive.google.com/uc?id={ID}&export=download
 *   https://docs.google.com/document/d/{ID}/edit
 *   https://docs.google.com/spreadsheets/d/{ID}/edit
 *   https://docs.google.com/presentation/d/{ID}/edit
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern 1: /d/{ID}/
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (dMatch) return dMatch[1];

  // Pattern 2: ?id={ID} or &id={ID}
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