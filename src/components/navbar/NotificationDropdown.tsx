// src/components/navbar/NotificationDropdown.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Trash2, X, Clock, Home, Calendar, Star, Megaphone, ExternalLink } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Notification } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function NotificationDropdown({ isOpen, onClose, onToggle }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, loading } = useNotifications();

  // ─── Close on click outside ───
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // ─── Handle notification click ───
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    onClose();
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // ─── Get icon for notification type ───
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_approved":
        return <Check className="text-green-500" size={16} />;
      case "booking_rejected":
        return <X className="text-red-500" size={16} />;
      case "booking_confirmed":
        return <Calendar className="text-blue-500" size={16} />;
      case "booking_requested":
        return <Home className="text-amber-500" size={16} />;
      case "booking_expired":
        return <Clock className="text-gray-500" size={16} />;
      case "announcement":
        return <Megaphone className="text-purple-500" size={16} />;
      default:
        return <Bell className="text-gray-500" size={16} />;
    }
  };

  // ─── Format timestamp ───
  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-2 z-50">
      <div className="w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[var(--nexora-primary)]" />
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[var(--nexora-primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--nexora-primary)] hover:bg-blue-50 transition-colors flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--nexora-primary)] border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell size={32} className="text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-500">All caught up!</p>
              <p className="text-xs text-gray-400">No new notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 flex items-start gap-3 ${
                  !notification.read ? "bg-blue-50/30" : ""
                }`}
              >
                {/* Indicator dot */}
                {!notification.read && (
                  <span className="mt-1.5 h-2 w-2 min-w-[8px] rounded-full bg-[var(--nexora-primary)]" />
                )}
                
                {/* Icon */}
                <div className="mt-0.5 flex h-8 w-8 min-w-[32px] items-center justify-center rounded-full bg-gray-100">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-xs text-gray-500 truncate">{notification.body}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>

                {/* Link indicator */}
                {notification.link && (
                  <ExternalLink size={12} className="text-gray-300 mt-1.5 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer – now links to the notifications page */}
        <div className="border-t border-gray-100 px-4 py-2.5 text-center">
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="text-xs font-medium text-[var(--nexora-primary)] hover:underline"
          >
            View all notifications →
          </Link>
        </div>
      </div>
    </div>
  );
}