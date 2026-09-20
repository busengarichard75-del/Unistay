"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import {
  getLibraryEntryById,
  getApprovedLibraryEntries,
} from "@/services/libraryService";
import {
  LibraryEntry,
  getLibraryCategoryMeta,
  buildDrivePreviewUrl,
} from "@/types/library";
import { LibraryCard } from "@/components/library/LibraryCard";
import { getUniversityShortLabel, getUniversityFullName } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
import { useAuth } from "@/lib/AuthContext";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Upload,
  Eye,
  ExternalLink,
  BookOpen,
  Share2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LibraryDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [entry, setEntry] = useState<LibraryEntry | null>(null);
  const [related, setRelated] = useState<LibraryEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shared, setShared] = useState(false);

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

        // Fetch related (same category, different id, top 4)
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

  // ── Share handler ──
  const handleShare = async () => {
    if (!entry) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = entry.title;
    const shareText = `${shareTitle} — shared on Peza Library`;

    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: shareTitle,
          text: shareText,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // user cancelled or clipboard failed — silent
    }
  };

  // ── Loading ──
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

  // ── Not found ──
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
  const previewUrl = buildDrivePreviewUrl(entry.driveLink);
  const isOwner = user?.uid === entry.uploaderId;

  const metaParts: string[] = [];
  if (entry.courseCode) metaParts.push(entry.courseCode);
  if (entry.year) metaParts.push(entry.year);
  if (entry.semester) metaParts.push(`Sem ${entry.semester}`);
  const metaLine = metaParts.join(" · ");

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium py-6">
        {/* ── Back ── */}
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[var(--nexora-navy)]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* ── Header card ── */}
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

          {/* ── Primary CTAs ── */}
          <div className="flex flex-wrap gap-2 border-t border-gray-100 p-4">
            <a
              href={entry.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--nexora-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
            >
              <ExternalLink size={14} />
              Open in Google Drive
            </a>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {shared ? <Check size={14} /> : <Share2 size={14} />}
              {shared ? "Copied" : "Share"}
            </button>
          </div>
        </div>

        {/* ── Inline preview (Drive iframe) ── */}
        {previewUrl ? (
          <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <BookOpen size={14} />
                Preview
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                Read directly on Peza — no download needed
              </p>
            </div>
            <div className="bg-gray-50">
              <iframe
                src={previewUrl}
                title={entry.title}
                className="h-[70vh] min-h-[500px] w-full border-0"
                loading="lazy"
                allow="autoplay"
              />
            </div>
            <div className="border-t border-gray-100 px-4 py-3 text-center">
              <p className="text-[11px] text-gray-400">
                Preview not loading?{" "}
                <a
                  href={entry.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--nexora-primary)] hover:underline"
                >
                  Open in Google Drive
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-xs text-amber-800">
              ⚠️ This material can&apos;t be previewed inline. Use the button above to open it in Google Drive.
            </p>
          </div>
        )}

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

        {/* ── Uploader info ── */}
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

        {/* ── Related materials ── */}
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
                <LibraryCard key={r.id} entry={r} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}