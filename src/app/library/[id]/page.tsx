"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import {
  getLibraryEntryById,
  getApprovedLibraryEntries,
  checkUnlockState,
  unlockMaterial,
  getPrivateDriveLink,
} from "@/services/libraryService";
import {
  LibraryEntryPublic,
  getLibraryCategoryMeta,
} from "@/types/library";
import { LibraryCard } from "@/components/library/LibraryCard";
import { getUniversityShortLabel, getUniversityFullName } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
import { useAuth } from "@/lib/AuthContext";
import { LoginRequiredModal } from "@/components/shared/LoginRequiredModal";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Upload,
  Eye,
  ExternalLink,
  Share2,
  Check,
  AlertTriangle,
  Lock,
  Loader2,
  Star,
  Send,
} from "lucide-react";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Challenge = "share" | "follow";

// ─── Peza's official Facebook page ───
const PEZA_FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61594233460420";

export default function LibraryDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [entry, setEntry] = useState<LibraryEntryPublic | null>(null);
  const [related, setRelated] = useState<LibraryEntryPublic[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shared, setShared] = useState(false);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [busyChallenge, setBusyChallenge] = useState<Challenge | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ⚡ Deps on user?.uid (stable string) — NOT user (new object each render)
  const uid = user?.uid;

  // ── Fetch entry + related ──
  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      try {
        const data = await getLibraryEntryById(id);
        if (!active) return;

        if (!data || data.adminHidden || data.status !== "approved") {
          setNotFound(true);
          setIsFetching(false);
          return;
        }
        setEntry(data);

        // Fire-and-forget view increment
        fetch("/api/library/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }).catch(() => {});

        const all = await getApprovedLibraryEntries();
        if (!active) return;
        const rel = all
          .filter(
            (e) =>
              e.id !== id &&
              e.category === data.category &&
              e.universityId === data.universityId
          )
          .slice(0, 4);
        setRelated(rel);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  // ── Check unlock state — deps on uid (string), not user ──
  useEffect(() => {
    if (!uid || !id) {
      setIsUnlocked(false);
      return;
    }
    let active = true;
    checkUnlockState(uid, id).then((unlocked) => {
      if (active) setIsUnlocked(unlocked);
    });
    return () => {
      active = false;
    };
  }, [uid, id]);

  // ── Share page (works for guests too — different from unlocking) ──
  const handleSharePage = async () => {
    if (!entry) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: entry.title,
          text: `${entry.title} — Peza Library`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        toast.success("Link copied!");
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // silent
    }
  };

  // ── Complete a challenge ──
  async function handleChallenge(challenge: Challenge) {
    if (!uid || !entry) {
      setShowLoginModal(true);
      return;
    }

    setBusyChallenge(challenge);
    try {
      const pageUrl =
        typeof window !== "undefined" ? window.location.href : "";

      if (challenge === "share") {
        const msg = `Free study materials on Peza — check this out: ${pageUrl}`;
        if (typeof navigator !== "undefined" && (navigator as any).share) {
          try {
            await (navigator as any).share({ title: "Peza Library", text: msg });
          } catch {
            // user cancelled — don't unlock
            setBusyChallenge(null);
            return;
          }
        } else {
          await navigator.clipboard.writeText(msg);
          toast.success("Share message copied!");
        }
      } else if (challenge === "follow") {
        window.open(PEZA_FACEBOOK_URL, "_blank", "noopener,noreferrer");
      }

      // Record the unlock
      await unlockMaterial(uid, entry.id, challenge);
      setIsUnlocked(true);
      toast.success("Material unlocked! 🎉");
    } catch (err) {
      console.error("Challenge failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setBusyChallenge(null);
    }
  }

  // ── Open the Drive link (fetch from libraryPrivate) ──
  async function handleOpen() {
    if (!entry) return;
    setUnlocking(true);
    try {
      const link = await getPrivateDriveLink(entry.id);
      if (!link) {
        toast.error("Couldn't retrieve the link. Please try again.");
        return;
      }
      window.open(link, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Open failed:", err);
      toast.error("Couldn't retrieve the link. Please try again.");
    } finally {
      setUnlocking(false);
    }
  }

  if (isFetching) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <div className="container-medium py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 rounded bg-gray-200" />
            <div className="h-16 w-full rounded-2xl bg-gray-200" />
            <div className="h-80 w-full rounded-2xl bg-gray-200" />
            <div className="h-32 w-full rounded-2xl bg-gray-200" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (notFound || !entry) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
        <Navbar />
        <div className="container-medium py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <AlertTriangle size={28} />
          </div>
          <p className="text-sm font-medium text-gray-800">Material not found</p>
          <p className="mt-1 text-xs text-gray-500">
            This material doesn&apos;t exist, is still pending review, or was removed.
          </p>
          <button
            onClick={() => router.push("/library")}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--nexora-primary)] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to Library
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  const cat = getLibraryCategoryMeta(entry.category);
  const isOwner = uid === entry.uploaderId;
  const canOpen = isUnlocked || isOwner;

  const metaParts: string[] = [];
  if (entry.courseCode) metaParts.push(entry.courseCode);
  if (entry.year) metaParts.push(entry.year);
  if (entry.semester) metaParts.push(`Sem ${entry.semester}`);
  const metaLine = metaParts.join(" · ");

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[var(--nexora-navy)]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* ── Header ── */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-6 text-white">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm">
                {cat?.icon || "📚"}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {cat?.label || "Material"}
                </span>
                <h1 className="mt-2 text-xl font-bold leading-tight sm:text-2xl">
                  {entry.title}
                </h1>
                {metaLine && (
                  <p className="mt-1.5 text-sm font-medium text-white/90">
                    {metaLine}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/85">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {getUniversityFullName(entry.universityId)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Upload size={12} />
                {entry.uploaderName}
              </span>
              {entry.createdAt && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} />
                  {timeAgo(entry.createdAt)}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Eye size={12} />
                {entry.views || 0} {entry.views === 1 ? "view" : "views"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-100 p-4">
            <button
              type="button"
              onClick={handleSharePage}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {shared ? <Check size={14} /> : <Share2 size={14} />}
              {shared ? "Copied" : "Share page"}
            </button>
          </div>
        </div>

        {/* ── THE GATE ── */}
        <div className="mt-6">
          {!uid ? (
            // ─── State 1: Not logged in ───
            <div className="overflow-hidden rounded-2xl border-2 border-dashed border-indigo-200 bg-white shadow-sm">
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                  <Lock size={28} />
                </div>
                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  🔒 Material Locked
                </h2>
                <p className="mt-2 max-w-sm text-sm text-gray-600">
                  Create a free Peza account to unlock this material and 70+
                  other study resources.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--nexora-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  Sign in to access this material
                </button>
                <p className="mt-3 text-[11px] text-gray-400">
                  Takes less than a minute · Free forever
                </p>
              </div>
            </div>
          ) : canOpen ? (
            // ─── State 3: Unlocked ───
            <div className="overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white shadow-sm">
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  ✓ Material Unlocked
                </h2>
                <p className="mt-2 max-w-sm text-sm text-gray-600">
                  {isOwner
                    ? "This is your upload — you can always open it."
                    : "You have full access to this material."}
                </p>
                <button
                  type="button"
                  onClick={handleOpen}
                  disabled={unlocking}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {unlocking ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ExternalLink size={16} />
                  )}
                  {unlocking ? "Opening…" : "Open in Google Drive"}
                </button>
              </div>
            </div>
          ) : (
            // ─── State 2: Logged in, not unlocked — 2 challenges ───
            <div className="overflow-hidden rounded-2xl border-2 border-dashed border-indigo-200 bg-white shadow-sm">
              <div className="px-6 pt-8 pb-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                  <Lock size={24} />
                </div>
                <h2 className="mt-3 text-lg font-bold text-gray-900">
                  🔒 Material Locked
                </h2>
                <p className="mt-2 max-w-sm text-sm text-gray-600">
                  Choose <span className="font-semibold">ONE</span> option below to
                  unlock this material.
                </p>
              </div>

              <div className="space-y-2 px-6 pb-8">
                {/* Challenge 1 — Share */}
                <button
                  type="button"
                  onClick={() => handleChallenge("share")}
                  disabled={!!busyChallenge}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/40 disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Send size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Share Peza
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Share Peza with a classmate
                    </p>
                  </div>
                  {busyChallenge === "share" ? (
                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                  ) : (
                    <ExternalLink size={16} className="text-gray-300" />
                  )}
                </button>

                {/* Challenge 2 — Follow */}
                <button
                  type="button"
                  onClick={() => handleChallenge("follow")}
                  disabled={!!busyChallenge}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/40 disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Star size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Follow Peza on Facebook
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Opens our official page
                    </p>
                  </div>
                  {busyChallenge === "follow" ? (
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  ) : (
                    <ExternalLink size={16} className="text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Description ── */}
        {entry.description && (
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              About this material
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {entry.description}
            </p>
          </div>
        )}

        {/* ── Uploader ── */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Shared by
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
              {entry.uploaderName
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .join("")
                .toUpperCase()
                .slice(0, 2) || "PS"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {entry.uploaderName}
              </p>
              <p className="text-xs text-gray-500">
                {isOwner ? "You · Your upload" : "Student contributor"}
              </p>
            </div>
            {isOwner && (
              <Link
                href="/library/my-uploads"
                className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Manage
              </Link>
            )}
          </div>
        </div>

        {/* ── Related ── */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-[var(--nexora-text-primary)]">
              Related {cat?.label || "materials"}
              <span className="ml-2 text-sm font-normal text-gray-400">
                near {getUniversityShortLabel(entry.universityId)}
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((r) => (
                <LibraryCard key={r.id} entry={r as any} />
              ))}
            </div>
          </div>
        )}
      </div>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to access"
        subtitle="Create a free Peza account to unlock this material and 70+ other study resources."
      />

      <Footer />
    </main>
  );
}