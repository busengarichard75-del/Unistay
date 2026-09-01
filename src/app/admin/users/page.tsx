"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { Search, User, Mail, Phone, Home, Calendar, Shield, MessageCircle, ArrowLeft, Loader2, X, Send, CheckCircle, Users } from "lucide-react";
import { toast } from "sonner";

interface UserData {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: "student" | "landlord";
  createdAt: number;
  studentNumber?: string;
  university?: string;
}

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendPush, setSendPush] = useState(true);

  // ─── Redirect if not admin ───
  useEffect(() => {
    if (!isLoading && !isAdminEmail(user?.email)) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // ─── Fetch all users ──────────────────────────────────────────
  useEffect(() => {
    if (!isAdminEmail(user?.email)) return;

    const fetchUsers = async () => {
      setIsFetching(true);
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const usersData: UserData[] = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserData[];
        usersData.sort((a, b) => b.createdAt - a.createdAt);
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchUsers();
  }, [user]);

  // ─── Filter users ─────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    const filtered = users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.includes(term) ||
        u.role?.includes(term) ||
        u.uid?.includes(term)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // ─── Send message to selected user ──────────────────────────
  const handleSendMessage = async () => {
    if (!selectedUser) return;
    if (!messageTitle.trim() || !messageBody.trim()) {
      toast.error("Please fill in both title and message.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/admin/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: messageTitle.trim(),
          body: messageBody.trim(),
          targetRole: undefined,
          userId: selectedUser.uid,
          sendPush: sendPush,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      toast.success(`Message sent to ${selectedUser.fullName}!`);
      setShowMessageModal(false);
      setMessageTitle("");
      setMessageBody("");
      setSendPush(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  // ─── Format date ─────────────────────────────────────────────
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-ZM", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ─── Render ──────────────────────────────────────────────────

  if (isLoading || !isAdminEmail(user?.email)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users size={24} className="text-blue-400" />
                User Management
              </h1>
              <p className="text-sm text-gray-400">
                {filteredUsers.length} users found ({users.length} total)
              </p>
            </div>
          </div>
        </div>

        {/* ─── Search ─── */}
        <div className="mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, role, or UID..."
              className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ─── User List ─── */}
        {isFetching ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-gray-800/50 p-4 h-16" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs text-gray-600">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div
                key={u.uid}
                className="flex flex-wrap items-center justify-between rounded-xl bg-gray-800/50 border border-gray-700 p-4 hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--nexora-primary)]/20 text-[var(--nexora-primary)]">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {u.fullName || "Unknown"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {u.email}
                        </span>
                        {u.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {u.phone}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.role === "landlord"
                              ? "bg-orange-900/30 text-orange-400"
                              : "bg-green-900/30 text-green-400"
                          }`}
                        >
                          {u.role || "student"}
                        </span>
                        {u.studentNumber && (
                          <span className="text-gray-500">ID: {u.studentNumber}</span>
                        )}
                        <span className="text-gray-500">Joined {formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex shrink-0 items-center gap-2 sm:mt-0">
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setShowMessageModal(true);
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle size={14} />
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Message Modal ─── */}
      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Send Message</h3>
                <p className="text-xs text-gray-400">To: {selectedUser.fullName || selectedUser.email}</p>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="e.g., Important Update"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Write your message here..."
                  rows={4}
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendPush"
                  checked={sendPush}
                  onChange={(e) => setSendPush(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sendPush" className="text-sm text-gray-300">
                  Send as push notification (if subscribed)
                </label>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isSending}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}