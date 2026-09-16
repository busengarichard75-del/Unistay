// src/components/admin/AdminModals.tsx
"use client";

import { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Home,
  User as UserIcon,
  Calendar,
  Star,
  Mail,
  MessageCircle,
  Ban,
  EyeOff,
  Trash2,
  CreditCard,
} from "lucide-react";

// ─── Shared shell ──────────────────────────────────────────────
function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-md",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-3 py-3 sm:px-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-800 bg-gray-900 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Primary / secondary buttons ───────────────────────────────
function PrimaryButton({
  children,
  onClick,
  disabled,
  danger,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {loading ? "Processing..." : children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
    >
      {children}
    </button>
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
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg bg-gray-800 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

// ═══════════════════════════════════════════════════════════════
// 1. HIDE PROPERTY MODAL
// ═══════════════════════════════════════════════════════════════
export const HIDE_REASONS = [
  "Spam or duplicate listing",
  "Inappropriate or misleading content",
  "Unverified claims",
  "Owner requested removal",
  "Under investigation",
  "Other",
];

export function HidePropertyModal({
  propertyTitle,
  onClose,
  onConfirm,
}: {
  propertyTitle: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState(HIDE_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const [loading, setLoading] = useState(false);

  const finalReason =
    reason === "Other"
      ? customNote.trim() || "Other"
      : customNote.trim()
      ? `${reason} — ${customNote.trim()}`
      : reason;

  return (
    <ModalShell
      title="Hide this property?"
      subtitle={propertyTitle}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-900/20 border border-amber-800/50 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-200 leading-relaxed">
            The property will be hidden from students. The landlord will be notified
            with the reason below. You can unhide anytime.
          </p>
        </div>

        <Field label="Reason">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputClass}
          >
            {HIDE_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>

        <Field label="Additional note (optional)">
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            rows={3}
            placeholder="Add context for the landlord..."
            className={inputClass}
          />
        </Field>

        <div className="flex gap-2 pt-2">
          <SecondaryButton onClick={onClose} disabled={loading}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            danger
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirm(finalReason);
              setLoading(false);
            }}
          >
            <span className="inline-flex items-center gap-2">
              <EyeOff size={14} /> Hide Property
            </span>
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. REFUND BOOST MODAL
// ═══════════════════════════════════════════════════════════════
export function RefundBoostModal({
  propertyTitle,
  onClose,
  onConfirm,
}: {
  propertyTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <ModalShell title="Refund Boost?" subtitle={propertyTitle} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Refund amount</span>
            <span className="text-lg font-bold text-white">K100</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            This removes the boost and logs the refund. You still need to send K100 back to the landlord manually (mobile money).
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <SecondaryButton onClick={onClose} disabled={loading}>Cancel</SecondaryButton>
          <PrimaryButton
            danger
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirm();
              setLoading(false);
            }}
          >
            <span className="inline-flex items-center gap-2">
              <CreditCard size={14} /> Refund K100
            </span>
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. SUSPEND USER MODAL
// ═══════════════════════════════════════════════════════════════
export const SUSPEND_REASONS = [
  "Fraudulent activity",
  "Abusive behavior",
  "Repeated fake listings",
  "Terms violation",
  "Payment dispute",
  "Other",
];

export function SuspendUserModal({
  userName,
  onClose,
  onConfirm,
}: {
  userName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState(SUSPEND_REASONS[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const finalReason =
    reason === "Other"
      ? note.trim() || "Other"
      : note.trim()
      ? `${reason} — ${note.trim()}`
      : reason;

  return (
    <ModalShell title="Suspend this user?" subtitle={userName} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg bg-red-900/20 border border-red-800/50 p-3">
          <Ban size={16} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-xs text-red-200 leading-relaxed">
            The user can still log in but won't be able to book or list. They'll see
            a banner with the reason below. You can unsuspend anytime.
          </p>
        </div>

        <Field label="Reason">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
            {SUSPEND_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>

        <Field label="Additional note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Internal note..."
            className={inputClass}
          />
        </Field>

        <div className="flex gap-2 pt-2">
          <SecondaryButton onClick={onClose} disabled={loading}>Cancel</SecondaryButton>
          <PrimaryButton
            danger
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirm(finalReason);
              setLoading(false);
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Ban size={14} /> Suspend User
            </span>
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. CANCEL BOOKING MODAL
// ═══════════════════════════════════════════════════════════════
export function CancelBookingModal({
  bookingLabel,
  onClose,
  onConfirm,
}: {
  bookingLabel: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <ModalShell title="Cancel this booking?" subtitle={bookingLabel} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg bg-red-900/20 border border-red-800/50 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-xs text-red-200 leading-relaxed">
            Both student and landlord will be notified. Reason will be shown to them.
          </p>
        </div>

        <Field label="Reason for cancellation">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Landlord reported property unavailable"
            className={inputClass}
            autoFocus
          />
        </Field>

        <div className="flex gap-2 pt-2">
          <SecondaryButton onClick={onClose} disabled={loading}>Keep Booking</SecondaryButton>
          <PrimaryButton
            danger
            loading={loading}
            disabled={!reason.trim()}
            onClick={async () => {
              setLoading(true);
              await onConfirm(reason.trim());
              setLoading(false);
            }}
          >
            Cancel Booking
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. DIRECT MESSAGE MODAL
// ═══════════════════════════════════════════════════════════════
export function DirectMessageModal({
  userName,
  onClose,
  onConfirm,
}: {
  userName: string;
  onClose: () => void;
  onConfirm: (title: string, body: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <ModalShell title="Send direct message" subtitle={userName} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Please update your listing"
            className={inputClass}
            autoFocus
          />
        </Field>

        <Field label="Message">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Type your message..."
            className={inputClass}
          />
        </Field>

        <p className="text-[11px] text-gray-500">
          Delivered as in-app notification + push. User can reply via support.
        </p>

        <div className="flex gap-2 pt-2">
          <SecondaryButton onClick={onClose} disabled={loading}>Cancel</SecondaryButton>
          <PrimaryButton
            loading={loading}
            disabled={!title.trim() || !body.trim()}
            onClick={async () => {
              setLoading(true);
              await onConfirm(title.trim(), body.trim());
              setLoading(false);
            }}
          >
            <span className="inline-flex items-center gap-2">
              <MessageCircle size={14} /> Send
            </span>
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. SEND EMAIL MODAL
// ═══════════════════════════════════════════════════════════════
export function SendEmailModal({
  toEmail,
  onClose,
  onConfirm,
}: {
  toEmail: string;
  onClose: () => void;
  onConfirm: (subject: string, message: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <ModalShell title="Send email" subtitle={toEmail} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Subject">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className={inputClass}
            autoFocus
          />
        </Field>

        <Field label="Message">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={7}
            placeholder="Write your email..."
            className={inputClass}
          />
        </Field>

        <p className="text-[11px] text-gray-500">
          Sent from Peza Accommodation. Replies go to pezaaccommodation@gmail.com.
        </p>

        <div className="flex gap-2 pt-2">
          <SecondaryButton onClick={onClose} disabled={loading}>Cancel</SecondaryButton>
          <PrimaryButton
            loading={loading}
            disabled={!subject.trim() || !message.trim()}
            onClick={async () => {
              setLoading(true);
              await onConfirm(subject.trim(), message.trim());
              setLoading(false);
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Mail size={14} /> Send Email
            </span>
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. GLOBAL SITE TOGGLE MODAL
// ═══════════════════════════════════════════════════════════════
export type SiteMode = "off" | "readonly";

export function SiteModeModal({
  currentMode,
  onClose,
  onConfirm,
}: {
  currentMode: SiteMode;
  onClose: () => void;
  onConfirm: (mode: SiteMode, message: string) => void;
}) {
  const [mode, setMode] = useState<SiteMode>(currentMode);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <ModalShell title="Change site mode" onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setMode("off")}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              mode === "off"
                ? "border-green-600 bg-green-900/20"
                : "border-gray-700 bg-gray-800/50 hover:bg-gray-800"
            }`}
          >
            <p className="text-sm font-medium text-white">🟢 Normal — Site online</p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              Everything works as normal.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("readonly")}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              mode === "readonly"
                ? "border-amber-600 bg-amber-900/20"
                : "border-gray-700 bg-gray-800/50 hover:bg-gray-800"
            }`}
          >
            <p className="text-sm font-medium text-white">🟡 Read-only — Maintenance mode</p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              Students can browse but can't book. Landlords can't add listings.
              Banners show on all pages.
            </p>
          </button>
        </div>

        {mode === "readonly" && (
          <Field label="Message shown to users">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="e.g. Peza is undergoing scheduled maintenance. Booking is paused — back soon!"
              className={inputClass}
            />
          </Field>
        )}

        <div className="flex gap-2 pt-2">
          <SecondaryButton onClick={onClose} disabled={loading}>Cancel</SecondaryButton>
          <PrimaryButton
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirm(mode, message.trim());
              setLoading(false);
            }}
          >
            Apply
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// 8. VIEW USER PROFILE MODAL
// ═══════════════════════════════════════════════════════════════
export interface UserProfileData {
  uid: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: "student" | "landlord" | "service_provider";
  university?: string;
  studentNumber?: string;
  createdAt?: number;
  suspended?: boolean;
  suspendedReason?: string | null;
  // Related data
  listings?: { id: string; title: string; price: number; location: string }[];
  bookings?: {
    id: string;
    propertyTitle: string;
    studentName?: string;
    price: number;
    status: string;
    createdAt: number;
  }[];
}

export function ViewUserProfileModal({
  profile,
  loading,
  onClose,
  onDirectMessage,
  onSendEmail,
  onToggleSuspend,
}: {
  profile: UserProfileData;
  loading: boolean;
  onClose: () => void;
  onDirectMessage: () => void;
  onSendEmail: () => void;
  onToggleSuspend: () => void;
}) {
  const isLandlord = profile.role === "landlord";
  const isProvider = profile.role === "service_provider";

  return (
    <ModalShell
      title={profile.fullName || profile.email}
      subtitle={`${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}${
        profile.suspended ? " · SUSPENDED" : ""
      }`}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {profile.suspended && (
          <div className="rounded-lg bg-red-900/20 border border-red-800/50 p-3">
            <p className="text-xs font-medium text-red-300">
              Suspended: {profile.suspendedReason || "No reason"}
            </p>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailRow icon={UserIcon} label="Email" value={profile.email} />
          <DetailRow icon={UserIcon} label="Phone" value={profile.phone || "N/A"} />
          <DetailRow
            icon={Home}
            label="University"
            value={profile.university || "N/A"}
          />
          {profile.studentNumber && (
            <DetailRow icon={UserIcon} label="Student ID" value={profile.studentNumber} />
          )}
          <DetailRow
            icon={Calendar}
            label="Joined"
            value={
              profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString()
                : "N/A"
            }
          />
          <DetailRow
            icon={isLandlord || isProvider ? Home : Calendar}
            label={isLandlord || isProvider ? "Listings" : "Bookings"}
            value={String(
              isLandlord || isProvider
                ? profile.listings?.length || 0
                : profile.bookings?.length || 0
            )}
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onDirectMessage}
            className="flex flex-col items-center gap-1.5 rounded-lg bg-blue-900/30 border border-blue-800/50 p-3 hover:bg-blue-900/50 transition-colors"
          >
            <MessageCircle size={16} className="text-blue-400" />
            <span className="text-[11px] font-medium text-blue-200">Message</span>
          </button>
          <button
            onClick={onSendEmail}
            className="flex flex-col items-center gap-1.5 rounded-lg bg-purple-900/30 border border-purple-800/50 p-3 hover:bg-purple-900/50 transition-colors"
          >
            <Mail size={16} className="text-purple-400" />
            <span className="text-[11px] font-medium text-purple-200">Email</span>
          </button>
          <button
            onClick={onToggleSuspend}
            className={`flex flex-col items-center gap-1.5 rounded-lg p-3 transition-colors ${
              profile.suspended
                ? "bg-green-900/30 border border-green-800/50 hover:bg-green-900/50"
                : "bg-red-900/30 border border-red-800/50 hover:bg-red-900/50"
            }`}
          >
            <Ban size={16} className={profile.suspended ? "text-green-400" : "text-red-400"} />
            <span className={`text-[11px] font-medium ${profile.suspended ? "text-green-200" : "text-red-200"}`}>
              {profile.suspended ? "Unsuspend" : "Suspend"}
            </span>
          </button>
        </div>

        {/* Listings (landlord or provider) */}
        {(isLandlord || isProvider) && profile.listings && profile.listings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">
              Listings ({profile.listings.length})
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {profile.listings.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-lg bg-gray-800/50 border border-gray-700 p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{l.title}</p>
                    <p className="text-[10px] text-gray-500">
                      {l.location} · K{l.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings (student OR landlord's incoming) */}
        {profile.bookings && profile.bookings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">
              {isLandlord ? "Incoming Booking Requests" : "Bookings"} ({profile.bookings.length})
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {profile.bookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-lg bg-gray-800/50 border border-gray-700 p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white truncate">
                      {b.propertyTitle}
                    </p>
                    <StatusPill status={b.status} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {isLandlord ? `From: ${b.studentName || "Student"}` : `By: ${b.studentName || "You"}`}
                    {" · "}K{b.price.toLocaleString()}
                    {" · "}{new Date(b.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <p className="text-center text-xs text-gray-500">Loading details...</p>
        )}
      </div>
    </ModalShell>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-gray-800/40 border border-gray-700 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-0.5">
        <Icon size={10} />
        {label}
      </div>
      <p className="text-xs font-medium text-white truncate">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    requested: "bg-amber-900/40 text-amber-300",
    approved: "bg-blue-900/40 text-blue-300",
    confirmed: "bg-green-900/40 text-green-300",
    rejected: "bg-red-900/40 text-red-300",
    expired: "bg-gray-800 text-gray-400",
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${map[status] || map.expired}`}>
      {status}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// 9. BULK VERIFY CONFIRM MODAL
// ═══════════════════════════════════════════════════════════════
export function BulkVerifyModal({
  count,
  status,
  onClose,
  onConfirm,
}: {
  count: number;
  status: "approved" | "rejected";
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <ModalShell
      title={`Bulk ${status === "approved" ? "Approve" : "Reject"} ${count} ${count === 1 ? "property" : "properties"}?`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-300">
          {status === "approved"
            ? "These properties will go live and appear to students."
            : "These properties will be rejected and won't appear to students."}
        </p>
        <div className="flex gap-2 pt-2">
          <SecondaryButton onClick={onClose} disabled={loading}>Cancel</SecondaryButton>
          <PrimaryButton
            danger={status === "rejected"}
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirm();
              setLoading(false);
            }}
          >
            Yes, {status === "approved" ? "Approve" : "Reject"} All
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}