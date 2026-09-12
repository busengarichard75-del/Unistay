// src/components/PostBookingChecklist.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Phone,
  MessageCircle,
  PartyPopper,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { BookingChecklist } from "@/types/bookingChecklist";
import {
  ensureChecklist,
  toggleStep,
  markCheckedIn,
} from "@/services/checklistService";
import { createNotification } from "@/services/notificationService";
import { sendPushNotification } from "@/lib/sendPushNotification";

const SUPPORT_PHONE_DISPLAY = "+260 0771319817";
const SUPPORT_PHONE_TEL = "+2600771319817";
const ADMIN_EMAIL = "busengarichard75@gmail.com";

// ─── Phone normalization for WhatsApp wa.me links ─────────────
function normalizeZambianPhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("260") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length >= 9) return "260" + digits.slice(1);
  if (digits.length === 9) return "260" + digits;
  return digits.length >= 10 ? digits : null;
}

interface PostBookingChecklistProps {
  booking: Booking;
}

async function findAdminUserId(): Promise<string | null> {
  try {
    const q = query(
      collection(db, "users"),
      where("email", "==", ADMIN_EMAIL),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id;
  } catch {
    return null;
  }
}

export function PostBookingChecklist({ booking }: PostBookingChecklistProps) {
  const [checklist, setChecklist] = useState<BookingChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [landlordPhone, setLandlordPhone] = useState<string | null>(null);

  // ─── Load checklist ─────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await ensureChecklist(booking.id);
        if (active) setChecklist(data);
      } catch {
        // Silent
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [booking.id]);

  // ─── Load landlord phone (confirmed bookings only) ──────────
  useEffect(() => {
    let active = true;
    const loadLandlord = async () => {
      try {
        const snap = await getDoc(doc(db, "users", booking.landlordId));
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data();
          const phone = data?.phone || data?.phoneNumber || null;
          setLandlordPhone(phone);
        }
      } catch {
        // Silent
      }
    };
    if (booking.landlordId) loadLandlord();
    return () => {
      active = false;
    };
  }, [booking.landlordId]);

  // ─── Toggle "Contacted landlord" ────────────────────────────
  async function handleToggleLandlordContacted() {
    if (!checklist || busy) return;
    const next = !checklist.steps.landlordContacted;
    setBusy(true);
    setChecklist({
      ...checklist,
      steps: { ...checklist.steps, landlordContacted: next },
    });
    try {
      await toggleStep(booking.id, "landlordContacted", next);
      if (next) toast.success("Nice! One step closer.");
    } catch {
      toast.error("Couldn't save. Please try again.");
      setChecklist({
        ...checklist,
        steps: { ...checklist.steps, landlordContacted: !next },
      });
    } finally {
      setBusy(false);
    }
  }

  // ─── Check in ───────────────────────────────────────────────
  async function handleCheckIn() {
    if (!checklist || checkingIn) return;
    setCheckingIn(true);
    try {
      const ts = Date.now();
      await markCheckedIn(booking.id, ts);
      setChecklist({
        ...checklist,
        steps: { ...checklist.steps, checkedIn: true },
        checkedInAt: ts,
      });
      toast.success("Welcome home! 🎉");

      // Notify landlord (in-app + push)
      try {
        await createNotification(booking.landlordId, {
          title: "Student checked in 🎉",
          body: `${booking.studentName} has checked in at "${booking.propertyTitle}".`,
          type: "booking_confirmed",
          link: "/dashboard/landlord",
        });
        await sendPushNotification({
          userId: booking.landlordId,
          title: "Student checked in 🎉",
          body: `${booking.studentName} has checked in at "${booking.propertyTitle}".`,
          url: "/dashboard/landlord",
        });
      } catch {
        // Silent
      }

      // Notify admin (in-app + push)
      try {
        const adminId = await findAdminUserId();
        if (adminId) {
          await createNotification(adminId, {
            title: "Booking completed ✅",
            body: `${booking.studentName} checked in at "${booking.propertyTitle}".`,
            type: "booking_confirmed",
            link: "/admin",
          });
          await sendPushNotification({
            userId: adminId,
            title: "Booking completed ✅",
            body: `${booking.studentName} checked in at "${booking.propertyTitle}".`,
            url: "/admin",
          });
        }
      } catch {
        // Silent
      }

      // ─── Fire-and-forget email to landlord ───
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          type: "student_checked_in",
        }),
      }).catch(() => {});
    } catch {
      toast.error("Couldn't mark as checked in. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  }

  // ─── Build WhatsApp link ────────────────────────────────────
  const waNumber = normalizeZambianPhone(landlordPhone);
  const waMessage = `Hi, I'm ${booking.studentName}. I've just booked "${booking.propertyTitle}" on Peza and would like to arrange move-in details.`;
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`
    : null;

  if (loading || !checklist) {
    return (
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-3 w-2/3 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  const { steps } = checklist;
  const completedCount = [
    steps.paymentReceived,
    steps.landlordContacted,
    steps.checkedIn,
  ].filter(Boolean).length;
  const totalSteps = 3;
  const allDone = completedCount === totalSteps;

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/40 to-white p-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-[var(--nexora-navy)]">
            <PartyPopper size={16} className="text-[var(--nexora-primary)]" />
            Next Steps
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {allDone ? "You're all set! 🎉" : `${completedCount} of ${totalSteps} complete`}
          </p>
        </div>
        <span className="text-xs font-medium text-[var(--nexora-primary)]">
          {Math.round((completedCount / totalSteps) * 100)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--nexora-primary)] to-[var(--nexora-navy)] transition-all duration-500"
          style={{ width: `${(completedCount / totalSteps) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2.5">
        <StepRow
          done={steps.paymentReceived}
          title="Agent fee received"
          subtitle="Confirmed by Peza — you're good to go."
        />

        <StepRow
          done={steps.landlordContacted}
          title="Contact your landlord"
          subtitle="Say hi and arrange your move-in details."
          action={
            !steps.landlordContacted && (
              <div className="mt-2 flex flex-wrap gap-2">
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <MessageCircle size={12} />
                    Chat on WhatsApp
                  </a>
                )}

                <Link
                  href={`/booking/confirmation/${booking.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Ticket size={12} />
                  Open Booking Pass
                </Link>

                <button
                  onClick={handleToggleLandlordContacted}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <CheckCircle2 size={12} />
                  I&apos;ve contacted them
                </button>
              </div>
            )
          }
        />

        <StepRow
          done={steps.checkedIn}
          title="Checked in"
          subtitle={
            steps.checkedIn && checklist.checkedInAt
              ? `Marked on ${new Date(checklist.checkedInAt).toLocaleDateString()}`
              : "Tick once you've met your landlord and moved into your room."
          }
          action={
            !steps.checkedIn && (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--nexora-success)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle2 size={12} />
                {checkingIn ? "Marking..." : "I've checked in"}
              </button>
            )
          }
        />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <Phone size={12} className="text-[var(--nexora-primary)]" />
        <span>Need help?</span>
        <a
          href={`tel:${SUPPORT_PHONE_TEL}`}
          className="font-medium text-[var(--nexora-primary)] hover:underline"
        >
          {SUPPORT_PHONE_DISPLAY}
        </a>
      </div>
    </div>
  );
}

// ─── Step Row ───────────────────────────────────────────────────
function StepRow({
  done,
  title,
  subtitle,
  action,
}: {
  done: boolean;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors ${
        done ? "bg-green-50/60" : "bg-white"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {done ? (
          <CheckCircle2 size={18} className="text-[var(--nexora-success)]" />
        ) : (
          <Circle size={18} className="text-gray-300" />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            done
              ? "text-[var(--nexora-success)] line-through decoration-1"
              : "text-gray-900"
          }`}
        >
          {title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        {action}
      </div>
    </div>
  );
}