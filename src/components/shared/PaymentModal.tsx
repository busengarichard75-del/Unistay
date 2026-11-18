
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  X,
  Smartphone,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title: string;
  type:
    | "provider_plan_pro"
    | "provider_plan_full_time"
    | "service_plan_standard"
    | "service_plan_pro";
  onSuccess: () => void;
}

type PaymentStatus = "idle" | "submitting" | "pending" | "successful" | "failed";

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  title,
  type,
  onSuccess,
}: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isOpen || !paymentId || status !== "pending") return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const checkStatus = async () => {
      if (cancelled) return;

      try {
        const user = auth.currentUser;
        if (!user) {
          setMessage("Please sign in again to check your payment.");
          setStatus("failed");
          return;
        }

        const token = await user.getIdToken();

        const response = await fetch(
          `/api/payments/ontech/subscription/status?paymentId=${encodeURIComponent(paymentId)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to check payment status.");
        }

        if (cancelled) return;

        if (data.status === "successful") {
          setStatus("successful");
          setMessage("Your payment has been verified and your plan is now active.");
          onSuccess();
          return;
        }

        if (data.status === "failed") {
          setStatus("failed");
          setMessage(data.message || "Your payment was unsuccessful. You can try again.");
          return;
        }

        setMessage(data.message || "Waiting for payment confirmation. Please approve the prompt on your phone.");
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to check payment status."
          );
        }
      }

      if (!cancelled) {
        timeout = setTimeout(checkStatus, 4000);
      }
    };

    timeout = setTimeout(checkStatus, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isOpen, paymentId, status, onSuccess]);

  if (!isOpen) return null;

  const resetModal = () => {
    setPhoneNumber("");
    setPaymentId(null);
    setStatus("idle");
    setMessage("");
    setChecking(false);
  };

  const handleClose = () => {
    if (status === "submitting" || checking) return;
    resetModal();
    onClose();
  };

  const handlePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedPhone = phoneNumber.trim();

    if (!cleanedPhone) {
      setMessage("Enter your mobile-money phone number.");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      setMessage("Please sign in again before making payment.");
      return;
    }

    setStatus("submitting");
    setMessage("Connecting securely to the payment gateway...");

    try {
      const token = await user.getIdToken();

      const response = await fetch(
        "/api/payments/ontech/subscription/initialize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            phoneNumber: cleanedPhone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start payment.");
      }

      if (typeof data.paymentId !== "string" || !data.paymentId) {
        throw new Error("The payment service returned an invalid response.");
      }

      setPaymentId(data.paymentId);
      setStatus("pending");
      setMessage(
        data.message ||
          "Payment request sent. Check your phone and approve the prompt."
      );
    } catch (error) {
      setStatus("failed");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while starting payment."
      );
    }
  };

  const handleRetry = () => {
    setPaymentId(null);
    setStatus("idle");
    setMessage("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Complete Payment
            </h2>
            <p className="mt-1 text-sm text-gray-500">{title}</p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={status === "submitting" || checking}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-40"
            aria-label="Close payment modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl bg-blue-50 p-5 text-center">
            <p className="text-sm font-medium text-blue-700">
              Amount to pay
            </p>
            <p className="mt-1 text-3xl font-extrabold text-blue-900">
              K{amount.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Zambia Kwacha (ZMW)
            </p>
          </div>

          {status === "successful" ? (
            <div className="rounded-xl bg-green-50 p-5 text-center">
              <CheckCircle2 className="mx-auto text-green-600" size={42} />
              <h3 className="mt-3 font-bold text-green-800">
                Payment verified!
              </h3>
              <p className="mt-2 text-sm text-green-700">{message}</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-5 w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
              >
                Done
              </button>
            </div>
          ) : status === "pending" ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-center">
              <Loader2 className="mx-auto animate-spin text-blue-600" size={36} />
              <h3 className="mt-3 font-bold text-blue-900">
                Awaiting payment
              </h3>
              <p className="mt-2 text-sm text-blue-800">{message}</p>
              <p className="mt-3 text-xs text-blue-700">
                Keep this window open while we verify your payment.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label
                  htmlFor="ontech-phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Mobile-money number
                </label>

                <div className="relative">
                  <Smartphone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="ontech-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="097XXXXXXX"
                    required
                    disabled={status === "submitting"}
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Use your MTN, Airtel or Zamtel mobile-money number.
                </p>
              </div>

              {message && status === "failed" && (
                <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Starting payment...
                  </>
                ) : (
                  `Pay K${amount.toFixed(2)}`
                )}
              </button>

              {status === "failed" && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Try again
                </button>
              )}
            </form>
          )}

          <p className="text-center text-xs text-gray-400">
            Payments are processed securely through Ontech.
          </p>
        </div>
      </div>
    </div>
  );
}
