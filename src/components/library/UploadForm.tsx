"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { addLibraryEntry } from "@/services/libraryService";
import { stripUndefined } from "@/lib/stripUndefined";
import {
  LIBRARY_CATEGORIES,
  LibraryCategory,
  isGoogleDriveUrl,
} from "@/types/library";
import { universities } from "@/data/universities";
import {
  BookOpen,
  FileText,
  Tag,
  School,
  Calendar,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  ArrowRight,
  Info,
  X,
  Loader2,
} from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) =>
  String(CURRENT_YEAR - i)
);

export function UploadForm() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<LibraryCategory>("past_papers");
  const [universityId, setUniversityId] = useState(user?.university || "");
  const [courseCode, setCourseCode] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [driveLink, setDriveLink] = useState("");

  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ─── Cover upload ─────────────────────────────────────
  async function handleCoverPick(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url: string | undefined =
        data?.url || data?.secure_url || data?.data?.url;
      if (!url) throw new Error("No URL returned");

      setCoverImageUrl(url);
      toast.success("Cover image added.");
    } catch (err) {
      console.error("Cover upload failed:", err);
      toast.error("Failed to upload cover. You can still submit without one.");
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleCoverPick(file);
  }

  // ─── Submit ───────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");

    // Validation
    if (!title.trim() || title.trim().length < 4) {
      setError("Please enter a title (at least 4 characters).");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError("Please add a short description (at least 10 characters).");
      return;
    }
    if (!category) {
      setError("Please pick a category.");
      return;
    }
    if (!universityId) {
      setError("Please select a university.");
      return;
    }
    if (!driveLink.trim()) {
      setError("Please paste a Google Drive link.");
      return;
    }
    if (!isGoogleDriveUrl(driveLink.trim())) {
      setError(
        "That doesn't look like a valid Google Drive link. Make sure sharing is set to 'Anyone with the link'."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const now = Date.now();
      const uploaderName =
        user.businessName?.trim() ||
        user.fullName?.trim() ||
        user.email?.split("@")[0] ||
        "Student";

      // ⚡ Build the payload, then strip undefined values.
      // Firestore rejects any field whose value is `undefined`.
      const rawPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        universityId,
        courseCode: courseCode.trim() || undefined,
        year: year.trim() || undefined,
        semester: semester.trim() || undefined,
        driveLink: driveLink.trim(),
        coverImageUrl: coverImageUrl || undefined,
        uploaderId: user.uid,
        uploaderName,
        status: "pending" as const,
        adminHidden: false,
        adminHiddenReason: null,
        views: 0,
        saves: 0,
        reports: 0,
        createdAt: now,
        updatedAt: now,
      };

      await addLibraryEntry(stripUndefined(rawPayload) as any);

      toast.success(
        "Submitted! Admin will review and publish within a few hours."
      );
      router.push("/library/my-uploads");
    } catch (err) {
      console.error("Submit failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/15 disabled:bg-gray-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ─── Link guidance (top, so they read it) ─── */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-indigo-600" />
        <div className="text-xs leading-relaxed text-indigo-900">
          <p className="font-semibold">Before you start — set your Google Drive link to public</p>
          <p className="mt-1 text-indigo-800/90">
            Open your file in Google Drive → Share → <strong>&quot;Anyone with the link&quot;</strong> → <strong>Viewer</strong> → Copy link.
          </p>
        </div>
      </div>

      {/* ─── Basic info ─── */}
      <Section icon={<FileText size={16} />} title="Basic information">
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., CS101 Intro to Programming — Past Papers 2023"
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's inside? Which topics does it cover? Any special notes?"
            rows={4}
            disabled={isSubmitting}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ─── Category & academic info ─── */}
      <Section icon={<Tag size={16} />} title="Category & course">
        <Field label="Category">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LIBRARY_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-xl border-2 p-3 text-left text-xs font-medium transition-all ${
                  category === c.id
                    ? "border-indigo-500 bg-indigo-50/60 text-indigo-900"
                    : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                }`}
              >
                <div className="text-base">{c.icon}</div>
                <div className="mt-1">{c.label}</div>
              </button>
            ))}
          </div>
        </Field>

        <Field label="University">
          <div className="relative">
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              disabled={isSubmitting}
              className={`${inputClass} appearance-none pr-10`}
            >
              <option value="">Select a university</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id} disabled={!u.isAvailable}>
                  {u.name}
                  {!u.isAvailable ? " (coming soon)" : ""}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              ▾
            </span>
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Course code (optional)">
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="e.g., CS101"
              disabled={isSubmitting}
              className={inputClass}
            />
          </Field>

          <Field label="Year (optional)">
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={isSubmitting}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="">Select year</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                ▾
              </span>
            </div>
          </Field>

          <Field label="Semester (optional)">
            <div className="relative">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                disabled={isSubmitting}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="">Select</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                ▾
              </span>
            </div>
          </Field>
        </div>
      </Section>

      {/* ─── The link ─── */}
      <Section icon={<LinkIcon size={16} />} title="Google Drive link">
        <Field label="Share link">
          <input
            type="url"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            disabled={isSubmitting}
            className={inputClass}
          />
          <p className="mt-1.5 text-[11px] text-gray-400">
            Peza doesn&apos;t host files — we link directly to your Drive. Make
            sure sharing is set to &quot;Anyone with the link&quot;.
          </p>
        </Field>
      </Section>

      {/* ─── Optional cover ─── */}
      <Section icon={<ImageIcon size={16} />} title="Cover image (optional)">
        {coverImageUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-gray-200">
            <img
              src={coverImageUrl}
              alt="Cover preview"
              className="h-40 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setCoverImageUrl(undefined)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              aria-label="Remove cover"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCover || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-6 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 disabled:opacity-60"
          >
            {isUploadingCover ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <ImageIcon size={16} />
                Add a cover image
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
        <p className="text-[11px] text-gray-400">
          Optional. A nice cover helps your material stand out. Max 5 MB.
        </p>
      </Section>

      {/* ─── Error ─── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ─── Submit row ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/library"
          className="w-full rounded-lg border border-gray-200 px-6 py-2.5 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:w-auto"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              Submit for review
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ──────────────────────────────────────────────── */
/* Sub-components                                  */
/* ──────────────────────────────────────────────── */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <span className="text-indigo-500">{icon}</span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}