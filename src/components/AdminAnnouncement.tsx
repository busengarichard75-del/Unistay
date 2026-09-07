// src/components/AdminAnnouncement.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, X } from "lucide-react";

interface AdminAnnouncementProps {
  onClose?: () => void;
}

export function AdminAnnouncement({ onClose }: AdminAnnouncementProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState<"all" | "student" | "landlord">("all");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in both title and body");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/admin/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          targetRole: targetRole === "all" ? undefined : targetRole,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send announcement");
      }

      toast.success(`Announcement sent to ${data.sent} users!`);
      setTitle("");
      setBody("");
      if (onClose) onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to send announcement");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Megaphone size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Send Announcement</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Announcement Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New Features Available!"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement here..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20 resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Audience
          </label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as typeof targetRole)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--nexora-primary)] focus:ring-2 focus:ring-[var(--nexora-primary)]/20"
          >
            <option value="all">All Users</option>
            <option value="student">Students Only</option>
            <option value="landlord">Landlords Only</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="w-full rounded-full bg-[var(--nexora-primary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexora-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "Sending..." : "Send Announcement"}
        </button>
      </form>
    </div>
  );
}