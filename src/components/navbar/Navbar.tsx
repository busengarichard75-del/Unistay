"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import { Plus, ClipboardList, Calendar, ShieldCheck, User, LogOut, Settings, LayoutDashboard, ChevronDown, Menu, X, Bell } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { useNotifications } from "@/hooks/useNotifications";

export function Navbar() {
  const { user, role, isLoading } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { counts } = useNotifications();

  // Hide navbar on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    try {
      await signOut(auth);
      toast.success("Logged out successfully.");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Notification count
  const notificationCount = counts.total;

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--nexora-navy)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-white">
          UniStayZM
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {isLoading ? null : user ? (
            <>
              {/* Quick actions (desktop) */}
              <div className="hidden items-center gap-4 md:flex">
                {isAdminEmail(user.email) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                  >
                    <ShieldCheck size={16} />
                    Admin
                  </Link>
                )}
                {role === "landlord" && (
                  <>
                    <Link
                      href="/dashboard/landlord/add-listing"
                      className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                    >
                      <Plus size={16} />
                      Add Listing
                    </Link>
                    <Link
                      href="/dashboard/landlord"
                      className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                    >
                      <ClipboardList size={16} />
                      Manage Listings
                    </Link>
                  </>
                )}
                {role === "student" && (
                  <Link
                    href="/dashboard/student"
                    className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                  >
                    <Calendar size={16} />
                    My Bookings
                  </Link>
                )}
              </div>

              {/* 🔔 Notification Bell */}
              <div className="relative">
                <Link
                  href={
                    role === "landlord"
                      ? "/dashboard/landlord"
                      : role === "student"
                      ? "/dashboard/student"
                      : "/"
                  }
                  className="relative flex items-center justify-center rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* 🍔 Hamburger (mobile) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors md:hidden"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* User Menu Dropdown */}
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--nexora-primary)] text-xs font-bold text-white">
                    {initials}
                  </div>
                  <span className="hidden max-w-[100px] truncate sm:inline-block">
                    {displayName}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {user.displayName || "User"}
                      </p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs capitalize text-blue-600">
                        {role || "user"}
                      </span>
                    </div>
                    <div className="py-1">
                      {role === "landlord" && (
                        <Link
                          href="/dashboard/landlord"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard size={16} />
                          Dashboard
                        </Link>
                      )}
                      {role === "student" && (
                        <Link
                          href="/dashboard/student"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard size={16} />
                          Dashboard
                        </Link>
                      )}
                      {isAdminEmail(user.email) && (
                        <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ShieldCheck size={16} />
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings size={16} />
                        Profile & Settings
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Not logged in
            <>
              <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white">
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[var(--nexora-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--nexora-primary-hover)]"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile Menu (full dropdown) */}
      {isMobileMenuOpen && user && (
        <div ref={mobileMenuRef} className="md:hidden bg-[var(--nexora-navy)] border-t border-white/10 px-4 py-4">
          <div className="flex flex-col space-y-3">
            <p className="text-sm text-gray-300 border-b border-white/10 pb-2">
              <span className="font-semibold text-white">{displayName}</span>
              <span className="ml-2 text-xs text-gray-400">{user.email}</span>
            </p>
            {role === "landlord" && (
              <>
                <Link
                  href="/dashboard/landlord/add-listing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                >
                  <Plus size={16} />
                  Add Listing
                </Link>
                <Link
                  href="/dashboard/landlord"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                >
                  <ClipboardList size={16} />
                  Manage Listings
                </Link>
              </>
            )}
            {role === "student" && (
              <Link
                href="/dashboard/student"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
              >
                <Calendar size={16} />
                My Bookings
              </Link>
            )}
            {isAdminEmail(user.email) && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
              >
                <ShieldCheck size={16} />
                Admin
              </Link>
            )}
            <Link
              href="/dashboard/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
            >
              <Settings size={16} />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 text-left"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}