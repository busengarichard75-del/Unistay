// src/components/admin/tabs/CommsTab.tsx
"use client";

import {
  Megaphone,
  MessageCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import type { UnansweredQuestion } from "@/components/admin/types";

interface CommsTabProps {
  announceContent: string;
  onAnnounceContentChange: (v: string) => void;
  isActive: boolean;
  isUpdatingAnnounce: boolean;
  loadingAnnounce: boolean;
  sendPush: boolean;
  onSendPushChange: (v: boolean) => void;
  pushTarget: "all" | "student" | "landlord";
  onPushTargetChange: (v: "all" | "student" | "landlord") => void;
  onPublishAnnounce: () => void;
  onHideAnnounce: () => void;

  unansweredQuestions: UnansweredQuestion[];
  filteredQuestions: UnansweredQuestion[];
  isFetchingQuestions: boolean;
  showResolved: boolean;
  onShowResolvedChange: (v: boolean) => void;
  isResolving: string | null;
  onMarkResolved: (id: string) => void;
}

export function CommsTab({
  announceContent,
  onAnnounceContentChange,
  isActive,
  isUpdatingAnnounce,
  loadingAnnounce,
  sendPush,
  onSendPushChange,
  pushTarget,
  onPushTargetChange,
  onPublishAnnounce,
  onHideAnnounce,
  unansweredQuestions,
  filteredQuestions,
  isFetchingQuestions,
  showResolved,
  onShowResolvedChange,
  isResolving,
  onMarkResolved,
}: CommsTabProps) {
  return (
    <div className="space-y-6">
      {/* Announcements */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone size={20} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Announcements</h2>
          {!loadingAnnounce && (
            <span
              className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isActive
                  ? "bg-green-900/50 text-green-400 border border-green-800"
                  : "bg-gray-800 text-gray-400 border border-gray-700"
              }`}
            >
              {isActive ? (
                <>
                  <Eye size={12} /> Active
                </>
              ) : (
                <>
                  <EyeOff size={12} /> Hidden
                </>
              )}
            </span>
          )}
        </div>

        <textarea
          value={announceContent}
          onChange={(e) => onAnnounceContentChange(e.target.value)}
          placeholder="Write your announcement..."
          rows={3}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
        />

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={sendPush}
                onChange={(e) => onSendPushChange(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-600"
              />
              Push notification
            </label>
            {sendPush && (
              <select
                value={pushTarget}
                onChange={(e) =>
                  onPushTargetChange(
                    e.target.value as "all" | "student" | "landlord"
                  )
                }
                className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-white outline-none"
              >
                <option value="all">All Users</option>
                <option value="student">Students Only</option>
                <option value="landlord">Landlords Only</option>
              </select>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onPublishAnnounce}
              disabled={isUpdatingAnnounce}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-700"
            >
              <Megaphone size={16} />
              {isUpdatingAnnounce ? "Publishing..." : "Publish"}
            </button>
            <button
              onClick={onHideAnnounce}
              disabled={isUpdatingAnnounce || !isActive}
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-700 disabled:opacity-50"
            >
              <EyeOff size={16} /> Hide
            </button>
          </div>
        </div>
      </div>

      {/* Student questions */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">
              Student Questions
            </h2>
            <span className="text-xs text-gray-400">
              ({unansweredQuestions.filter((q) => !q.resolved).length})
            </span>
          </div>
          <button
            onClick={() => onShowResolvedChange(!showResolved)}
            className="text-xs text-gray-400 hover:text-white"
          >
            {showResolved ? "Hide resolved" : "Show resolved"}
          </button>
        </div>

        {isFetchingQuestions ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-16 bg-gray-800 rounded-lg"
              />
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No unanswered questions.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className={`rounded-lg p-4 border ${
                  q.resolved
                    ? "bg-gray-800/30 border-gray-700 opacity-60"
                    : "bg-gray-800/50 border-yellow-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white break-words">
                      {q.message}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span>
                        {q.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                      </span>
                      {q.userEmail && <span>👤 {q.userEmail}</span>}
                    </div>
                  </div>
                  {!q.resolved && (
                    <button
                      onClick={() => onMarkResolved(q.id)}
                      disabled={isResolving === q.id}
                      className="ml-2 shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isResolving === q.id ? "..." : "Resolve"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}