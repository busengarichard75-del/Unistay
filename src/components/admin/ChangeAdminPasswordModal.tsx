"use client";

import { useState } from "react";
import { Key, X } from "lucide-react";
import { toast } from "sonner";
import { setAdminPassword } from "@/services/adminGateService";

interface ChangeAdminPasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangeAdminPasswordModal({
  onClose,
  onSuccess,
}: ChangeAdminPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !isSaving;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    try {
      // Verify current password before allowing change
      const { verifyAdminPassword } = await import("@/services/adminGateService");
      const ok = await verifyAdminPassword(currentPassword);
      if (!ok) {
        toast.error("Current password is incorrect.");
        setIsSaving(false);
        return;
      }

      await setAdminPassword(newPassword);
      toast.success("Admin password updated. Use it on your next login.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
      onClick={() => !isSaving && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-blue-400" />
            <h3 className="text-base font-bold text-white">Change Admin Password</h3>
          </div>
          <button
            onClick={() => !isSaving && onClose()}
            className="text-gray-500 hover:text-white"
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              New password <span className="text-gray-500">(8+ characters)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              disabled={isSaving}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-400">Passwords don't match.</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}