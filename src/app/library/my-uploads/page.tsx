"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { BackButton } from "@/components/ui/BackButton";
import {
  getLibraryEntriesByUploader,
  deleteLibraryEntry,
} from "@/services/libraryService";
import {
  LibraryEntry,
  getLibraryCategoryMeta,
} from "@/types/library";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
import {
  Plus,
  BookOpen,
  Eye,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  EyeOff,
  ArrowRight,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function MyLibraryUploadsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // ── Fetch uploader's entries ──
  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const data = await getLibraryEntriesByUploader(user.uid);
        if (!active) return;
        setEntries(data);
      } catch {
        // silent
      } finally {
        if (active) setIsFetching(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user]);

  // ── Delete handler ──
  async function handleDelete(id: string, title: string) {
    if (
      !window.confirm(
        `Delete "${title}"? This cannot be undone.`
      )
    )
      return;

    setBusyId(id);
    try {
      await deleteLibraryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Material deleted.");
    } catch {
      toast.error("Failed to delete material.");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  // ── Stats ──
  const totalCount = entries.length;
  const pendingCount = entries.filter((e) => e.status === "pending").length;
  const approvedCount = entries.filter((e) => e.status === "approved").length;
  const rejectedCount = entries.filter((e) => e.status === "rejected").length;
  const totalViews = entries.reduce((sum, e) => sum + (e.views || 0), 0);

  // ── Filter ──
  const filtered = entries.filter((e) => {
    if (statusFilter === "all") return true;
    return e.status === statusFilter;
  });

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium py-6">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* ── Header ── */}
        <div className="card-premium bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-md">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <BookOpen size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold sm:text-xl">My Library Uploads</h1>
              <p className="mt-0.5 text-xs text-white/85 sm:text-sm">
                Materials you&apos;ve shared with other students
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Total" value={totalCount} icon={<BookOpen size={14} />} />
            <StatBox label="Approved" value={approvedCount} icon={<CheckCircle2 size={14} />} />
            <StatBox label="Pending" value={pendingCount} icon={<Clock size={14} />} />
            <StatBox label="Views" value={totalViews} icon={<Eye size={14} />} />
          </div>
        </div>

        {/* ── Add CTA ── */}
        <div className="mt-6">
          <Link
            href="/library/new"
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-5 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Plus size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-indigo-900">
                Share another material
              </p>
              <p className="text-xs text-indigo-700/80">
                Past papers, notes, summaries, or study guides
              </p>
            </div>
            <ArrowRight
              size={18}
              className="shrink-0 text-indigo-400"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* ── Filter chips ── */}
        {entries.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {(["all", "approved", "pending", "rejected"] as StatusFilter[]).map(
              (s) => {
                const count =
                  s === "all"
                    ? totalCount
                    : s === "approved"
                    ? approvedCount
                    : s === "pending"
                    ? pendingCount
                    : rejectedCount;
                const label =
                  s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? "bg-[var(--nexora-primary)] text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                    <span
                      className={`text-[10px] font-semibold ${
                        statusFilter === s ? "text-white/80" : "text-gray-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* ── List ── */}
        <div className="mt-4">
          {isFetching ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 h-4 w-2/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="card-premium p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                <BookOpen size={28} />
              </div>
              <p className="text-sm font-medium text-[var(--nexora-text-primary)]">
                You haven&apos;t shared anything yet
              </p>
              <p className="mt-1 text-xs text-[var(--nexora-text-secondary)]">
                Share your notes, past papers, or study guides — help other
                students and build your contributor profile.
              </p>
              <Link
                href="/library/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95"
              >
                <Plus size={14} />
                Share your first material
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-premium p-8 text-center">
              <p className="text-sm text-gray-500">
                No {statusFilter} materials.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => (
                <MyUploadRow
                  key={entry.id}
                  entry={entry}
                  busy={busyId === entry.id}
                  onDelete={() => handleDelete(entry.id, entry.title)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

/* ──────────────────────────────────────────────── */
/* Stat box                                        */
/* ──────────────────────────────────────────────── */
function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────── */
/* Row                                             */
/* ──────────────────────────────────────────────── */
function MyUploadRow({
  entry,
  busy,
  onDelete,
}: {
  entry: LibraryEntry;
  busy: boolean;
  onDelete: () => void;
}) {
  const cat = getLibraryCategoryMeta(entry.category);

  const statusStyles: Record<
    LibraryEntry["status"],
    { bg: string; text: string; icon: React.ReactNode; label: string }
  > = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: <Clock size={11} />,
      label: "Pending review",
    },
    approved: {
      bg: "bg-green-50",
      text: "text-green-700",
      icon: <CheckCircle2 size={11} />,
      label: "Approved",
    },
    rejected: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: <XCircle size={11} />,
      label: "Rejected",
    },
    hidden: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      icon: <EyeOff size={11} />,
      label: "Hidden",
    },
  };
  const style = statusStyles[entry.status];

  const metaParts: string[] = [];
  if (entry.courseCode) metaParts.push(entry.courseCode);
  if (entry.year) metaParts.push(entry.year);
  if (entry.semester) metaParts.push(`Sem ${entry.semester}`);
  const metaLine = metaParts.join(" · ");

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg text-white">
          {cat?.icon || "📚"}
        </div>

        <div className="min-w-0 flex-1">
          {/* Title */}
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {entry.title}
          </h3>

          {/* Meta */}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
            {metaLine && (
              <span className="font-medium text-indigo-600">{metaLine}</span>
            )}
            {entry.universityId && (
              <span>{getUniversityShortLabel(entry.universityId)}</span>
            )}
            {entry.createdAt && (
              <span className="text-gray-400">
                · {timeAgo(entry.createdAt)}
              </span>
            )}
          </div>

          {/* Status + stats row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}
            >
              {style.icon}
              {style.label}
            </span>

            {entry.status === "approved" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                <Eye size={10} />
                {entry.views || 0} views
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
        {entry.status === "approved" && (
          <Link
            href={`/library/${entry.id}`}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ExternalLink size={12} />
            View
          </Link>
        )}

        <a
          href={entry.driveLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ExternalLink size={12} />
          Open Drive
        </a>

        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 size={12} />
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}