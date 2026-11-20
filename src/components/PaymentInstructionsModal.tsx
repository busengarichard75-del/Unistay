
"use client";

import { useEffect, useState } from "react";
import {
  X,
  Phone,
  AlertCircle,
  Smartphone,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Booking } from "@/types/booking";
import { BookingCountdown } from "@/components/BookingCountdown";
import { auth } from "@/lib/firebase";

const AGENT_FEE = "K100";
const SUPPORT_PHONE_DISPLAY = "+260 0771319817";
const SUPPORT_PHONE_TEL = "+2600771319817";
const STATUS_CHECK_INTERVAL = 4000;

interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
}

type PaymentState =
  | "idle"
  | "submitting"
  | "pending"
  | "success"
  | "failed"
  | "requires_review";

export function PaymentInstructionsModal({
  isOpen,
  onClose,
  booking,
}: PaymentInstructionsModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [message, setMessage] = useState("");
  const [paymentId, setPaymentId] = useState("");

  // Close the modal with Escape and prevent background scrolling.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && paymentState !== "submitting") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, paymentState]);

  // Reset the modal when opened for a new booking.
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber("");
      setPaymentState("idle");
      setMessage("");
      setPaymentId("");
    }
  }, [isOpen, booking.id]);

  // Automatically check Ontech transaction status while pending.
  useEffect(() => {
    if (!isOpen || !paymentId || paymentState !== "pending") {
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function checkPaymentStatus() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          if (active) {
            setMessage(
              "Your session has expired. Please log in again to check your payment."
            );
          }
          return;
        }

        const token = await currentUser.getIdToken();

        const response = await fetch(
          `/api/payments/ontech/agent-fee/status?paymentId=${encodeURIComponent(paymentId)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data = await response.json().catch(() => null);

        if (!active) return;

        if (data?.status === "successful" && response.ok) {
          setPaymentState("success");
          setMessage(
            data.message || "Your payment has been verified and your booking is confirmed."
          );
          toast.success("Payment verified! Your booking is confirmed.");
          return;
        }

        if (data?.status === "failed") {
          setPaymentState("failed");
          setMessage(data.message || "The payment failed. You may try again.");
          toast.error("Payment failed.");
          return;
        }

        if (data?.status === "requires_review") {
          setPaymentState("requires_review");
          setMessage(
            data.message ||
              "Payment was received, but your booking needs manual review."
          );
          toast.info("Your payment requires manual review.");
          return;
        }

        if (data?.status === "pending") {
          setMessage(
            data.message ||
              "Waiting for payment confirmation. Please approve the prompt on your phone."
          );
        }
      } catch (error) {
        console.error("Payment status check failed:", error);
      }

      // Retry while the payment remains pending.
      if (active) {
        timer = setTimeout(checkPaymentStatus, STATUS_CHECK_INTERVAL);
      }
    }

    checkPaymentStatus();

    return () => {
      active = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isOpen, paymentId, paymentState]);

  if (!isOpen) return null;

  async function initiatePayment() {
    const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, "");
    const normalizedPhone = cleanedPhone.startsWith("+")
      ? cleanedPhone.slice(1)
      : cleanedPhone;

    if (!/^(09\d{8}|2609\d{8})$/.test(normalizedPhone)) {
      toast.error(
        "Enter a valid number, for example 097XXXXXXX or 26097XXXXXXX."
      );
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast.error("Your session has expired. Please log in again.");
      return;
    }

    setPaymentState("submitting");
    setMessage("");
    setPaymentId("");

    try {
      const token = await currentUser.getIdToken();

      const response = await fetch("/api/payments/ontech/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          phoneNumber: cleanedPhone,
        }),
      });

      const data = await response.json().catch(() => null);

      // If the gateway returned a payment ID despite an HTTP error,
      // retain it so the student can still check the transaction.
      if (!response.ok) {
        if (data?.paymentId) {
          setPaymentId(data.paymentId);
          setPaymentState("pending");
          setMessage(
            data.error ||
              "The payment request may have reached the gateway. Checking its status..."
          );
          toast.info("Checking your payment request.");
          return;
        }

        throw new Error(
          data?.error || "Unable to start your payment. Please try again."
        );
      }

      if (!data?.paymentId) {
        throw new Error(
          "The payment service returned an incomplete response."
        );
      }

      setPaymentId(data.paymentId);

      if (data.status === "failed") {
        setPaymentState("failed");
        setMessage(data.message || "The payment request failed.");
        toast.error("Payment request failed.");
      } else {
        setPaymentState("pending");
        setMessage(
          data.message ||
            "Payment request sent. Check your phone and approve the payment."
        );
        toast.success("Payment request sent. Check your phone.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while starting your payment.";

      setPaymentState("failed");
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  }

  function resetPayment() {
    setPaymentState("idle");
    setMessage("");
    setPaymentId("");
  }

  function refreshBooking() {
    window.location.reload();
  }

  const isPending = paymentState === "pending";
  const isSuccessful = paymentState === "success";
  const needsReview = paymentState === "requires_review";
  const isFailed = paymentState === "failed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={() => {
        if (paymentState !== "submitting") onClose();
      }}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <h3 className="text-base font-bold text-[var(--nexora-navy)]">
            Pay Agent Fee
          </h3>

          <button
            onClick={onClose}
            disabled={paymentState === "submitting"}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Amount */}
          <div className="rounded-xl bg-gradient-to-br from-[var(--nexora-primary)] to-[var(--nexora-navy)] p-4 text-white">
            <p className="text-xs text-white/70">Amount to pay</p>
            <p className="mt-0.5 text-3xl font-bold">{AGENT_FEE}</p>
            <p className="mt-1 text-xs text-white/80">
              Agent fee for{" "}
              <span className="font-medium">{booking.propertyTitle}</span>
            </p>
          </div>

          {/* Initial payment form */}
          {paymentState === "idle" ||
          paymentState === "submitting" ? (
            <>
              <div>
                <label
                  htmlFor="ontech-phone"
                  className="mb-1.5 block text-xs font-semibold text-gray-700"
                >
                  Mobile money number
                </label>

                <div className="relative">
                  <Smartphone
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="ontech-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="09XXXXXXXX or 2609XXXXXXXX"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(event.target.value)
                    }
                    disabled={paymentState === "submitting"}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-gray-500">
                  Use the number registered with MTN, Airtel or Zamtel
                  Mobile Money.
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3.5">
                <p className="mb-2 text-xs font-semibold text-blue-900">
                  How it works
                </p>

                <ol className="space-y-1.5 text-xs text-blue-800">
                  <li>1. Enter your mobile-money number.</li>
                  <li>2. Tap the payment button below.</li>
                  <li>3. Check your phone for the payment prompt.</li>
                  <li>4. Approve the K100 payment on your phone.</li>
                  <li>5. Peza verifies the payment and confirms your booking.</li>
                </ol>
              </div>

              <button
                onClick={initiatePayment}
                disabled={
                  paymentState === "submitting" || !phoneNumber.trim()
                }
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--nexora-navy)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paymentState === "submitting" ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Starting payment...
                  </>
                ) : (
                  "Pay K100"
                )}
              </button>
            </>
          ) : (
            <>
              {/* Payment result */}
              <div
                className={`rounded-xl border p-4 ${
                  isSuccessful
                    ? "border-green-200 bg-green-50"
                    : needsReview
                      ? "border-amber-200 bg-amber-50"
                      : isPending
                        ? "border-blue-200 bg-blue-50"
                        : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isSuccessful ? (
                    <CheckCircle2
                      size={23}
                      className="mt-0.5 shrink-0 text-green-600"
                    />
                  ) : needsReview ? (
                    <AlertCircle
                      size={23}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />
                  ) : isPending ? (
                    <Loader2
                      size={23}
                      className="mt-0.5 shrink-0 animate-spin text-blue-600"
                    />
                  ) : (
                    <AlertCircle
                      size={23}
                      className="mt-0.5 shrink-0 text-red-600"
                    />
                  )}

                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isSuccessful
                          ? "text-green-900"
                          : needsReview
                            ? "text-amber-900"
                            : isPending
                              ? "text-blue-900"
                              : "text-red-900"
                      }`}
                    >
                      {isSuccessful
                        ? "Booking confirmed!"
                        : needsReview
                          ? "Payment received — review required"
                          : isPending
                            ? "Waiting for payment confirmation"
                            : "Payment unsuccessful"}
                    </p>

                    <p
                      className={`mt-1 text-xs leading-relaxed ${
                        isSuccessful
                          ? "text-green-800"
                          : needsReview
                            ? "text-amber-800"
                            : isPending
                              ? "text-blue-800"
                              : "text-red-800"
                      }`}
                    >
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              {isPending && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
                  <p className="text-xs font-semibold text-gray-800">
                    What happens next?
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    Approve the payment prompt on your phone. Peza is
                    automatically checking the transaction with Ontech.
                    Please do not submit another payment while this request
                    is pending.
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-700">
                    <RefreshCw size={13} className="animate-spin" />
                    Checking payment status...
                  </div>
                </div>
              )}

              {isSuccessful && (
                <button
                  onClick={refreshBooking}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <CheckCircle2 size={17} />
                  View confirmed booking
                </button>
              )}

              {needsReview && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <p className="text-xs leading-relaxed text-amber-900">
                    Your payment has been verified by the gateway, but Peza
                    could not automatically confirm this booking. Please
                    contact support. Do not pay again.
                  </p>
                </div>
              )}

              {isFailed && (
                <button
                  onClick={resetPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--nexora-navy)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <RefreshCw size={15} />
                  Try again
                </button>
              )}

              {paymentId && (
                <p className="break-all text-center text-[10px] text-gray-400">
                  Payment reference: {paymentId}
                </p>
              )}
            </>
          )}

          {/* Expiry */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <AlertCircle size={12} />
              Booking payment deadline
            </p>

            <BookingCountdown booking={booking} />
          </div>

          {/* Support */}
          <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <Phone
              size={12}
              className="text-[var(--nexora-primary)]"
            />

            <span>Need help?</span>

            <a
              href={`tel:${SUPPORT_PHONE_TEL}`}
              className="font-medium text-[var(--nexora-primary)] hover:underline"
            >
              {SUPPORT_PHONE_DISPLAY}
            </a>
          </div>

          <button
            onClick={onClose}
            disabled={paymentState === "submitting"}
            className="w-full rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {isPending ? "Close" : "Hide"}
          </button>
        </div>
      </div>
    </div>
  );
}
