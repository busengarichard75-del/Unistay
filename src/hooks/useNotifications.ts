// src/hooks/useNotifications.ts
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { 
  Notification, 
  listenToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications 
} from "@/services/notificationService";

interface NotificationCounts {
  pendingRequests: number;
  pendingApprovals: number;
  pendingPayments: number;
  total: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ─── Real-time notifications listener ───
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const unsubscribe = listenToNotifications(user.uid, (fetchedNotifications) => {
      setNotifications(fetchedNotifications);
      const unread = fetchedNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ─── Mark a single notification as read ───
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // ─── Mark all notifications as read ───
  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // ─── Clear all notifications ───
  const clearAll = async () => {
    if (!user) return;
    try {
      await clearAllNotifications(user.uid);
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  // ─── Legacy count logic (for existing notification bell) ───
  const [legacyCounts, setLegacyCounts] = useState<NotificationCounts>({
    pendingRequests: 0,
    pendingApprovals: 0,
    pendingPayments: 0,
    total: 0,
  });

  // Keep the existing counting logic for the bell badge
  // This will be replaced by unreadCount from the new system
  useEffect(() => {
    // We'll use unreadCount as the primary source
    setLegacyCounts((prev) => ({
      ...prev,
      total: unreadCount,
    }));
  }, [unreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    // For backward compatibility
    counts: legacyCounts,
  };
}