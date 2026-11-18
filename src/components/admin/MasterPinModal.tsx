"use client";

import { useState } from "react";
import { Shield, X } from "lucide-react";
import { verifyMasterPin } from "@/services/masterPinService";

interface MasterPinModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MasterPinModal({ title, description, onClose, onSuccess }: MasterPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const ok = await verifyMasterPin(pin);
      if (ok) {
        onSuccess();
        onClose();
      } else {
        setError("Incorrect master PIN.");
        setPin("");
      }
    } catch {
      setError("Verification failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 px-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-red-800/50 bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-900/40">
            <Shield size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">{title}</h3>
            {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
          </div>
          <button
            onClick={() => !busy && onClose()}
            className="text-gray-500 hover:text-white"
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Master PIN (6 digits)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-red-500"
              placeholder="••••••"
              autoFocus
              disabled={busy}
            />
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => !busy && onClose()}
              disabled={busy}
              className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pin.length !== 6 || busy}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "Verifying..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}