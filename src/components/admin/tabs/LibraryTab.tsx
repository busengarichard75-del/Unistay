// src/components/admin/tabs/LibraryTab.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getPendingLibraryEntries,
  getApprovedLibraryEntries,
  setLibraryEntryStatus,
  updateLibraryEntry,
  deleteLibraryEntry,
} from "@/services/libraryService";
import { LibraryEntry, getLibraryCategoryMeta } from "@/types/library";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  EyeOff,
  ExternalLink,
  BookOpen,
} from "lucide-react";

type Tab = "pending" | "approved";

export function LibraryTab() {
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<LibraryEntry[]>([]);
  const [approved, setApproved] = useState<LibraryEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Load entries ──
  const loadAll = async () => {
    try {
      const [pend, appr] = await Promise.all([
        getPendingLibraryEntries(),
        getApprovedLibraryEntries(),
      ]);
      setPending(pend);
      setApproved(appr);
    } catch (err) {
      console.error("Failed to load library entries:", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ── Approve ──
  async function handleApprove(entry: LibraryEntry) {
    setBusyId(entry.id);
    try {
      await setLibraryEntryStatus(entry.id, "approved");
      setPending((prev) => prev.filter((e) => e.id !== entry.id));
      setApproved((prev) => [{ ...entry, status: "approved" }, ...prev]);
      toast.success(`"${entry.title}" approved.`);
    } catch {
      toast.error("Failed to approve.");
    } finally {
      setBusyId(null);
    }
  }

  // ── Reject ──
  async function handleReject(entry: LibraryEntry) {
    const reason = window.prompt(
      `Reject "${entry.title}"? Optional reason (not shown to uploader):`,
      ""
    );
    if (reason === null) return;

    setBusyId(entry.id);
    try {
      await updateLibraryEntry(entry.id, {
        status: "rejected",
        adminHiddenReason: reason.trim() || null,
        updatedAt: Date.now(),
      });
      setPending((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success("Rejected.");
    } catch {
      toast.error("Failed to reject.");
    } finally {
      setBusyId(null);
    }
  }

  // ── Hide approved (soft remove) ──
  async function handleHide(entry: LibraryEntry) {
    if (!window.confirm(`Hide "${entry.title}" from public view?`)) return;
    setBusyId(entry.id);
    try {
      await updateLibraryEntry(entry.id, {
        adminHidden: true,
        adminHiddenReason: "Hidden by admin",
        updatedAt: Date.now(),
      });
      setApproved((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success("Hidden from public view.");
    } catch {
      toast.error("Failed to hide.");
    } finally {
      setBusyId(null);
    }
  }

  // ── Hard delete ──
  async function handleDelete(entry: LibraryEntry) {
    if (
      !window.confirm(
        `Permanently delete "${entry.title}"? This cannot be undone.`
      )
    )
      return;
    setBusyId(entry.id);
    try {
      await deleteLibraryEntry(entry.id);
      setPending((prev) => prev.filter((e) => e.id !== entry.id));
      setApproved((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success("Deleted permanently.");
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setBusyId(null);
    }
  }

  const currentList = tab === "pending" ? pending : approved;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-amber-800/50 bg-amber-900/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Pending</span>
            <Clock size={14} className="text-amber-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{pending.length}</p>
        </div>
        <div className="rounded-xl border border-green-800/50 bg-green-900/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Live</span>
            <CheckCircle2 size={14} className="text-green-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-white">
            {approved.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-gray-900/50 p-1">
        <TabBtn
          active={tab === "pending"}
          onClick={() => setTab("pending")}
          icon={<Clock size={14} />}
          label="Pending"
          count={pending.length}
          accent="amber"
        />
        <TabBtn
          active={tab === "approved"}
          onClick={() => setTab("approved")}
          icon={<CheckCircle2 size={14} />}
          label="Live"
          count={approved.length}
          accent="green"
        />
      </div>

      {/* Content */}
      <div>
        {isFetching ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-32 rounded-xl bg-gray-800"
              />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-10 text-center">
            <BookOpen size={28} className="mx-auto text-gray-700" />
            <p className="mt-2 text-sm text-gray-500">
              {tab === "pending"
                ? "No pending library materials."
                : "No approved materials yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((entry) => (
              <AdminEntryRow
                key={entry.id}
                entry={entry}
                tab={tab}
                busy={busyId === entry.id}
                onApprove={() => handleApprove(entry)}
                onReject={() => handleReject(entry)}
                onHide={() => handleHide(entry)}
                onDelete={() => handleDelete(entry)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────── */
/* Tab button                                      */
/* ──────────────────────────────────────────────── */
function TabBtn({
  active,
  onClick,
  icon,
  label,
  count,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: "amber" | "green";
}) {
  const activeClass =
    accent === "amber"
      ? "bg-amber-600 text-white"
      : "bg-green-600 text-white";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
        active ? activeClass : "text-gray-400 hover:bg-gray-800 hover:text-white"
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          active ? "bg-white/25" : "bg-gray-800 text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ──────────────────────────────────────────────── */
/* Entry row                                       */
/* ──────────────────────────────────────────────── */
function AdminEntryRow({
  entry,
  tab,
  busy,
  onApprove,
  onReject,
  onHide,
  onDelete,
}: {
  entry: LibraryEntry;
  tab: Tab;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onHide: () => void;
  onDelete: () => void;
}) {
  const cat = getLibraryCategoryMeta(entry.category);

  const metaParts: string[] = [];
  if (entry.courseCode) metaParts.push(entry.courseCode);
  if (entry.year) metaParts.push(entry.year);
  if (entry.semester) metaParts.push(`Sem ${entry.semester}`);
  const metaLine = metaParts.join(" · ");

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-lg text-white">
          {cat?.icon || "📚"}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">
            {entry.title}
          </h3>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400">
            {metaLine && (
              <span className="font-medium text-indigo-400">{metaLine}</span>
            )}
            <span>{getUniversityShortLabel(entry.universityId)}</span>
            <span>·</span>
            <span>by {entry.uploaderName}</span>
            {entry.createdAt && (
              <span className="text-gray-600">
                · {timeAgo(entry.createdAt)}
              </span>
            )}
          </div>

          {entry.description && (
            <p className="mt-2 line-clamp-2 text-xs text-gray-400">
              {entry.description}
            </p>
          )}

          <a
            href={entry.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:underline"
          >
            <ExternalLink size={11} />
            Preview Drive link
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-800 pt-3">
        {tab === "pending" && (
          <>
            <button
              onClick={onApprove}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 size={12} />
              {busy ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={onReject}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-red-800 bg-red-900/30 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-900/50 disabled:opacity-50"
            >
              <XCircle size={12} />
              Reject
            </button>
          </>
        )}

        {tab === "approved" && (
          <>
            <Link
              href={`/library/${entry.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
            >
              <Eye size={12} />
              View public
            </Link>
            <button
              onClick={onHide}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              <EyeOff size={12} />
              Hide
            </button>
          </>
        )}

        <button
          onClick={onDelete}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/50 disabled:opacity-50"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}