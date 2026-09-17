// src/components/admin/tabs/UsersTab.tsx
"use client";

import { Search, Users, MessageCircle, Mail, Ban } from "lucide-react";
import type { DirectoryUser } from "@/components/admin/types";

interface UsersTabProps {
  filteredUsers: DirectoryUser[];
  isFetchingUsers: boolean;
  userSearchTerm: string;
  onUserSearchTermChange: (v: string) => void;
  userRoleFilter: "all" | "student" | "landlord";
  onUserRoleFilterChange: (v: "all" | "student" | "landlord") => void;
  onOpenProfile: (u: DirectoryUser) => void;
  onDirectMessage: (u: DirectoryUser) => void;
  onEmail: (u: DirectoryUser) => void;
  onSuspendToggle: (u: DirectoryUser) => void;
}

export function UsersTab({
  filteredUsers,
  isFetchingUsers,
  userSearchTerm,
  onUserSearchTermChange,
  userRoleFilter,
  onUserRoleFilterChange,
  onOpenProfile,
  onDirectMessage,
  onEmail,
  onSuspendToggle,
}: UsersTabProps) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">User Directory</h2>
          <span className="text-xs text-gray-400">
            ({filteredUsers.length})
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={userSearchTerm}
            onChange={(e) => onUserSearchTermChange(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
          />
        </div>
        {(["all", "student", "landlord"] as const).map((r) => (
          <button
            key={r}
            onClick={() => onUserRoleFilterChange(r)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              userRoleFilter === r
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {isFetchingUsers ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-14 bg-gray-800 rounded-lg"
            />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No users found.
        </p>
      ) : (
        <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2">
          {filteredUsers.map((u) => (
            <div
              key={u.uid}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                u.suspended
                  ? "bg-red-900/10 border-red-900/50"
                  : "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {u.fullName || u.email}
                  {u.suspended && (
                    <span className="ml-2 text-[10px] font-semibold text-red-400 bg-red-900/40 px-2 py-0.5 rounded-full">
                      SUSPENDED
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {u.email} · {u.role}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  onClick={() => onOpenProfile(u)}
                  className="rounded-lg bg-gray-700 px-3 py-1.5 text-[11px] font-medium text-gray-200 hover:bg-gray-600"
                >
                  View
                </button>
                <button
                  onClick={() => onDirectMessage(u)}
                  className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                  title="Message"
                >
                  <MessageCircle size={14} />
                </button>
                <button
                  onClick={() => onEmail(u)}
                  className="rounded-lg bg-purple-600 p-1.5 text-white hover:bg-purple-700"
                  title="Email"
                >
                  <Mail size={14} />
                </button>
                <button
                  onClick={() => onSuspendToggle(u)}
                  className={`rounded-lg p-1.5 text-white ${
                    u.suspended
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  title={u.suspended ? "Unsuspend" : "Suspend"}
                >
                  <Ban size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}