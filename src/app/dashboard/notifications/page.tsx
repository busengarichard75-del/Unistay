"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, ArrowLeft, Home, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Notification, listenToNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToNotifications(user.uid, (fetched) => {
      setNotifications(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all as read.");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications? This cannot be undone.")) return;
    if (!user) return;
    try {
      await clearAllNotifications(user.uid);
      setNotifications([]);
      toast.success("Notifications cleared.");
    } catch {
      toast.error("Failed to clear notifications.");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "booking_approved": return "✅";
      case "booking_rejected": return "❌";
      case "booking_confirmed": return "🎉";
      case "booking_requested": return "📩";
      case "booking_expired": return "⏰";
      case "announcement": return "📢";
      default: return "🔔";
    }
  };

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading || loading) {
    return (
      <main className="min-h-screen bg-[var(--nexora-surface)] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 rounded bg-gray-200 mx-auto" />
          <div className="mt-4 space-y-2">
            <div className="h-12 w-full max-w-md rounded bg-gray-200 mx-auto" />
            <div className="h-12 w-full max-w-md rounded bg-gray-200 mx-auto" />
            <div className="h-12 w-full max-w-md rounded bg-gray-200 mx-auto" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--nexora-surface)] py-6">
      <div className="container-medium">
        {/* Navigation */}
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[var(--nexora-navy)] transition-colors"
          >
            <Home size={18} />
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Notifications</span>
        </div>

        {/* Header */}
        <div className="card-premium bg-[var(--nexora-navy)] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={24} />
              <div>
                <h1 className="text-xl font-bold">Notifications</h1>
                <p className="text-sm text-gray-300">
                  {unreadCount} unread · {notifications.length} total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors flex items-center gap-1.5"
                >
                  <CheckCheck size={16} />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={16} />
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="mt-8 card-premium bg-white p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-600">All caught up!</p>
            <p className="text-sm text-gray-400">You have no notifications.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer border-l-4 ${
                  notification.read
                    ? "border-transparent opacity-70"
                    : "border-[var(--nexora-primary)]"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-xl">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="rounded-full bg-[var(--nexora-primary)] h-2 w-2 min-w-[8px]" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{notification.body}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatTime(notification.createdAt)}</span>
                      {notification.link && (
                        <span className="flex items-center gap-0.5 text-[var(--nexora-primary)]">
                          <ExternalLink size={12} />
                          View
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      aria-label="Mark as read"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nexora-text-secondary)] hover:text-[var(--nexora-navy)] transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}