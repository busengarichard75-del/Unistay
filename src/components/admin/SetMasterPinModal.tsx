"use client";

import { useState, useEffect } from "react";
import { Lock, X } from "lucide-react";
import { toast } from "sonner";
import { hasMasterPin, setMasterPin, verifyMasterPin } from "@/services/masterPinService";

interface SetMasterPinModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function SetMasterPinModal({ onClose, onSuccess }: SetMasterPinModalProps) {
  const [checking, setChecking] = useState(true);
  const [has, setHas] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hasMasterPin()
      .then((v) => {
        setHas(v);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const valid =
    next.length === 6 &&
    next === confirm &&
    (!has || current.length === 6) &&
    !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      if (has) {
        if (!(await verifyMasterPin(current))) {
          toast.error("Current master PIN is incorrect.");
          setBusy(false);
          return;
        }
      }
      await setMasterPin(next);
      toast.success(has ? "Master PIN updated." : "Master PIN set. Destructive actions now require it.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80">
        <p className="text-xs text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 px-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {has ? "Change Master PIN" : "Set Master PIN"}
            </h3>
          </div>
          <button onClick={() => !busy && onClose()} disabled={busy} className="text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-400">
          {has
            ? "This PIN is required before deleting listings, suspending users, changing plans, refunding boosts, cancelling bookings, or changing the admin password."
            : "Set a 6-digit PIN that ONLY you (the head admin) know. It will be required for all destructive actions."}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {has && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Current master PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={current}
                onChange={(e) => setCurrent(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-center text-xl tracking-[0.3em] text-white outline-none focus:border-amber-500"
                placeholder="••••••"
                disabled={busy}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">New 6-digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={next}
              onChange={(e) => setNext(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-center text-xl tracking-[0.3em] text-white outline-none focus:border-amber-500"
              placeholder="••••••"
              autoFocus={!has}
              disabled={busy}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Confirm new PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-center text-xl tracking-[0.3em] text-white outline-none focus:border-amber-500"
              placeholder="••••••"
              disabled={busy}
            />
            {confirm && next !== confirm && (
              <p className="mt-1 text-xs text-red-400">PINs don't match.</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid}
              className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {busy ? "Saving..." : has ? "Update PIN" : "Set PIN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}