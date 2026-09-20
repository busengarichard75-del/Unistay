"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { BackButton } from "@/components/ui/BackButton";
import {
  getPendingLibraryEntries,
  getApprovedLibraryEntries,
  setLibraryEntryStatus,
  updateLibraryEntry,
  deleteLibraryEntry,
} from "@/services/libraryService";
import {
  LibraryEntry,
  getLibraryCategoryMeta,
} from "@/types/library";
import { getUniversityShortLabel } from "@/lib/universityLabels";
import { timeAgo } from "@/lib/timeUtils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  EyeOff,
  ExternalLink as ExternalLinkIcon,
} from "lucide-react";

type Tab = "pending" | "approved" | "rejected";

export default function LibraryAdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<LibraryEntry[]>([]);
  const [approved, setApproved] = useState<LibraryEntry[]>([]);
  const [rejected, setRejected] = useState<LibraryEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Auth guard — must be admin ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAdminEmail(user.email)) {
      router.replace("/library");
    }
  }, [user, authLoading, router]);

  // ── Load entries ──
  const loadAll = async () => {
    try {
      const [pend, appr] = await Promise.all([
        getPendingLibraryEntries(),
        getApprovedLibraryEntries(),
      ]);
      setPending(pend);
      setApproved(appr);
      // For rejected: fetch by uploader would need a scan. For v1 we skip
      // historical rejected entries — admin can still see them via Firestore
      // console. Rejected entries are permanently discarded from the UI.
      setRejected([]);
    } catch {
      // silent
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!user || !isAdminEmail(user.email)) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    if (reason === null) return; // cancelled

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

  if (authLoading || !user || !isAdminEmail(user.email)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const currentList =
    tab === "pending" ? pending : tab === "approved" ? approved : rejected;

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium py-6">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* ── Header ── */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold sm:text-xl">
                Library Moderation
              </h1>
              <p className="mt-0.5 text-xs text-white/70 sm:text-sm">
                Review student-uploaded materials before they go live
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Pending
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {pending.length}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Live
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {approved.length}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Rejected
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {rejected.length}
              </p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-white p-1 shadow-sm">
          <TabBtn
            active={tab === "pending"}
            onClick={() => setTab("pending")}
            icon={<Clock size={16} />}
            label="Pending"
            count={pending.length}
            accent="amber"
          />
          <TabBtn
            active={tab === "approved"}
            onClick={() => setTab("approved")}
            icon={<CheckCircle2 size={16} />}
            label="Approved"
            count={approved.length}
            accent="green"
          />
          <TabBtn
            active={tab === "rejected"}
            onClick={() => setTab("rejected")}
            icon={<XCircle size={16} />}
            label="Rejected"
            count={rejected.length}
            accent="red"
          />
        </div>

        {/* ── Content ── */}
        <div className="mt-6">
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
          ) : currentList.length === 0 ? (
            <div className="card-premium p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                {tab === "pending" ? (
                  <Clock size={28} />
                ) : tab === "approved" ? (
                  <CheckCircle2 size={28} />
                ) : (
                  <XCircle size={28} />
                )}
              </div>
              <p className="text-sm font-medium text-gray-800">
                {tab === "pending"
                  ? "No pending materials"
                  : tab === "approved"
                  ? "No approved materials yet"
                  : "No rejected materials"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {tab === "pending"
                  ? "New uploads will appear here for review."
                  : "Nothing to show in this tab."}
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

      <Footer />
    </main>
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
  accent: "amber" | "green" | "red";
}) {
  const activeClass =
    accent === "amber"
      ? "bg-amber-500 text-white"
      : accent === "green"
      ? "bg-green-600 text-white"
      : "bg-red-600 text-white";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ? activeClass : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          active ? "bg-white/25" : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ──────────────────────────────────────────────── */
/* Admin entry row                                 */
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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg text-white">
          {cat?.icon || "📚"}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {entry.title}
          </h3>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
            {metaLine && (
              <span className="font-medium text-indigo-600">{metaLine}</span>
            )}
            <span>{getUniversityShortLabel(entry.universityId)}</span>
            <span>·</span>
            <span>by {entry.uploaderName}</span>
            {entry.createdAt && (
              <span className="text-gray-400">
                · {timeAgo(entry.createdAt)}
              </span>
            )}
          </div>

          {/* Description preview */}
          {entry.description && (
            <p className="mt-2 line-clamp-2 text-xs text-gray-600">
              {entry.description}
            </p>
          )}

          {/* Drive link preview */}
          <a
            href={entry.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:underline"
          >
            <ExternalLinkIcon size={11} />
            Preview Drive link
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
        {tab === "pending" && (
          <>
            <button
              onClick={onApprove}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 size={12} />
              {busy ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={onReject}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-4 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
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
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Eye size={12} />
              View public
            </Link>
            <button
              onClick={onHide}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <EyeOff size={12} />
              Hide
            </button>
          </>
        )}

        {/* Delete always available — admin override */}
        <button
          onClick={onDelete}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}