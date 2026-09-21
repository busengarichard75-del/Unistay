"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import {
  Plus,
  ClipboardList,
  Calendar,
  ShieldCheck,
  LogOut,
  Settings,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Bell,
  Wrench,
  ShoppingBag,
  Store,
  Map as MapIcon,
  User as UserIcon,
  BookOpen,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDropdown } from "@/components/navbar/NotificationDropdown";

export function Navbar() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { counts, unreadCount } = useNotifications();

  const effectiveRole = user?.role || null;

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;

    setIsLoggingOut(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await signOut(auth);
      toast.success("Logged out successfully.");
      router.push("/");
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const displayName =
    user?.fullName || user?.businessName || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const notificationCount = unreadCount ?? counts.total;

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const closeNotification = () => {
    setIsNotificationOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full navbar-animated">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-4">
          <Link href="/" className="shrink-0 text-base font-bold text-white sm:text-lg">
            Peza ZM
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            {isLoading ? null : user ? (
              <>
                {/* Quick actions (desktop) */}
                <div className="hidden items-center gap-4 md:flex">
                  <Link
                    href="/services"
                    className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                  >
                    <Wrench size={16} />
                    Services
                  </Link>
                  <Link
                    href="/marketplace"
                    className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                  >
                    <ShoppingBag size={16} />
                    Marketplace
                  </Link>
                  <Link
                    href="/map"
                    className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                  >
                    <MapIcon size={16} />
                    Map
                  </Link>
                  <Link
                    href="/library"
                    className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                  >
                    <BookOpen size={16} />
                    Library
                  </Link>

                  {isAdminEmail(user.email) && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                    >
                      <ShieldCheck size={16} />
                      Admin
                    </Link>
                  )}

                  {effectiveRole === "landlord" && (
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

                  {effectiveRole === "service_provider" && (
                    <>
                      <Link
                        href="/dashboard/provider/add-listing"
                        className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                      >
                        <Plus size={16} />
                        Add Listing
                      </Link>
                      <Link
                        href="/dashboard/provider"
                        className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                      >
                        <Store size={16} />
                        My Listings
                      </Link>
                    </>
                  )}

                  {effectiveRole === "student" && (
                    <Link
                      href="/dashboard/student"
                      className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white"
                    >
                      <Calendar size={16} />
                      My Bookings
                    </Link>
                  )}
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={toggleNotification}
                    className="relative flex items-center justify-center rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors sm:p-2"
                    aria-label="Notifications"
                  >
                    <Bell size={18} className="sm:hidden" />
                    <Bell size={20} className="hidden sm:block" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg sm:h-5 sm:w-5 sm:text-[10px]">
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </span>
                    )}
                  </button>

                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={closeNotification}
                    onToggle={toggleNotification}
                  />
                </div>

                {/* Hamburger (mobile) */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex items-center justify-center rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors sm:p-2 md:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>

                {/* User Menu Dropdown (desktop) */}
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

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                        <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs capitalize text-blue-600">
                          {effectiveRole === "service_provider"
                            ? "Service Provider"
                            : effectiveRole || "user"}
                        </span>
                      </div>
                      <div className="py-1">
                        {effectiveRole === "landlord" && (
                          <Link
                            href="/dashboard/landlord"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <LayoutDashboard size={16} />
                            Dashboard
                          </Link>
                        )}
                        {effectiveRole === "student" && (
                          <Link
                            href="/dashboard/student"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <LayoutDashboard size={16} />
                            Dashboard
                          </Link>
                        )}
                        {effectiveRole === "service_provider" && (
                          <Link
                            href="/dashboard/provider"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <LayoutDashboard size={16} />
                            My Dashboard
                          </Link>
                        )}

                        <Link
                          href="/services"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Wrench size={16} />
                          Services
                        </Link>
                        <Link
                          href="/marketplace"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ShoppingBag size={16} />
                          Marketplace
                        </Link>
                        <Link
                          href="/map"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <MapIcon size={16} />
                          Peza Map
                        </Link>
                        <Link
                          href="/library"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <BookOpen size={16} />
                          Library
                        </Link>

                        {/* ❤️ Saved Items */}
                        <Link
                          href="/saved"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Heart size={16} />
                          Saved Items
                        </Link>

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
                          disabled={isLoggingOut}
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <LogOut size={16} />
                          {isLoggingOut ? "Logging out..." : "Log Out"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/services"
                  className="hidden items-center gap-1 text-xs font-medium text-gray-300 hover:text-white sm:flex sm:text-sm"
                >
                  <Wrench size={14} className="sm:hidden" />
                  <Wrench size={16} className="hidden sm:block" />
                  <span className="hidden xs:inline sm:inline">Services</span>
                </Link>
                <Link
                  href="/marketplace"
                  className="hidden items-center gap-1 text-xs font-medium text-gray-300 hover:text-white sm:flex sm:text-sm"
                >
                  <ShoppingBag size={14} className="sm:hidden" />
                  <ShoppingBag size={16} className="hidden sm:block" />
                  <span className="hidden xs:inline sm:inline">Marketplace</span>
                </Link>
                <Link
                  href="/map"
                  className="hidden items-center gap-1 text-xs font-medium text-gray-300 hover:text-white sm:flex sm:text-sm"
                >
                  <MapIcon size={14} className="sm:hidden" />
                  <MapIcon size={16} className="hidden sm:block" />
                  <span className="hidden xs:inline sm:inline">Map</span>
                </Link>
                <Link
                  href="/library"
                  className="hidden items-center gap-1 text-xs font-medium text-gray-300 hover:text-white sm:flex sm:text-sm"
                >
                  <BookOpen size={14} className="sm:hidden" />
                  <BookOpen size={16} className="hidden sm:block" />
                  <span className="hidden xs:inline sm:inline">Library</span>
                </Link>
                <Link
                  href="/login"
                  className="text-xs font-medium text-gray-300 hover:text-white sm:text-sm"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="shrink-0 whitespace-nowrap rounded-full bg-[var(--nexora-primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--nexora-primary-hover)] sm:px-4 sm:py-2 sm:text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* ─── MOBILE QUICK ICON ROW ─── */}
        <div className="border-t border-white/10 md:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1 px-3 py-1">
            <MobileQuickIcon
              href="/services"
              label="Services"
              accent="from-cyan-500 to-teal-600"
              icon={<Wrench size={14} />}
            />
            <MobileQuickIcon
              href="/map"
              label="Map"
              accent="from-emerald-500 to-green-600"
              icon={<MapIcon size={14} />}
            />
            <MobileQuickIcon
              href="/marketplace"
              label="Marketplace"
              accent="from-orange-500 to-pink-600"
              icon={<ShoppingBag size={14} />}
            />
            <MobileQuickIcon
              href="/library"
              label="Library"
              accent="from-indigo-500 to-purple-600"
              icon={<BookOpen size={14} />}
            />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MOBILE SIDE DRAWER                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isMobileMenuOpen && user && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <aside
            className="fixed right-0 top-0 z-[101] flex h-screen w-72 max-w-[85vw] flex-col bg-[var(--nexora-navy)] shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--nexora-primary)] text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <span className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                {effectiveRole === "service_provider"
                  ? "Service Provider"
                  : effectiveRole || "User"}
              </span>

              <nav className="space-y-1.5">
                {effectiveRole === "landlord" && (
                  <DrawerLink
                    href="/dashboard/landlord"
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                  />
                )}
                {effectiveRole === "student" && (
                  <DrawerLink
                    href="/dashboard/student"
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                  />
                )}
                {effectiveRole === "service_provider" && (
                  <DrawerLink
                    href="/dashboard/provider"
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                  />
                )}

                {effectiveRole === "landlord" && (
                  <>
                    <DrawerLink
                      href="/dashboard/landlord/add-listing"
                      icon={<Plus size={16} />}
                      label="Add Listing"
                    />
                    <DrawerLink
                      href="/dashboard/landlord"
                      icon={<ClipboardList size={16} />}
                      label="Manage Listings"
                    />
                  </>
                )}

                {effectiveRole === "service_provider" && (
                  <>
                    <DrawerLink
                      href="/dashboard/provider/add-listing"
                      icon={<Plus size={16} />}
                      label="Add Listing"
                    />
                    <DrawerLink
                      href="/dashboard/provider"
                      icon={<Store size={16} />}
                      label="My Listings"
                    />
                  </>
                )}

                {effectiveRole === "student" && (
                  <DrawerLink
                    href="/dashboard/student"
                    icon={<Calendar size={16} />}
                    label="My Bookings"
                  />
                )}

                <div className="my-3 border-t border-white/10" />

                <DrawerLink
                  href="/services"
                  icon={<Wrench size={16} />}
                  label="Services"
                />
                <DrawerLink
                  href="/marketplace"
                  icon={<ShoppingBag size={16} />}
                  label="Marketplace"
                />
                <DrawerLink
                  href="/map"
                  icon={<MapIcon size={16} />}
                  label="Peza Map"
                />
                <DrawerLink
                  href="/library"
                  icon={<BookOpen size={16} />}
                  label="Library"
                />

                {/* ❤️ Saved Items — mobile drawer */}
                <DrawerLink
                  href="/saved"
                  icon={<Heart size={16} />}
                  label="Saved Items"
                />

                <div className="my-3 border-t border-white/10" />

                <DrawerLink
                  href="/dashboard/profile"
                  icon={<UserIcon size={16} />}
                  label="Profile & Settings"
                />

                {isAdminEmail(user.email) && (
                  <DrawerLink
                    href="/admin"
                    icon={<ShieldCheck size={16} />}
                    label="Admin Panel"
                  />
                )}

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="mt-1.5 flex w-full items-center gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-left text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  <LogOut size={16} />
                  <span className="flex-1">
                    {isLoggingOut ? "Logging out..." : "Log Out"}
                  </span>
                </button>
              </nav>
            </div>

            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-center text-[10px] text-white/40">
                Peza ZM · Find what you need
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

/* ──────────────────────────────────────────────── */
/* Mobile Quick Icon (icon-only, compact)          */
/* ──────────────────────────────────────────────── */
function MobileQuickIcon({
  href,
  label,
  icon,
  accent,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="flex items-center justify-center py-0.5 active:scale-95 transition-transform"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm`}
      >
        {icon}
      </span>
    </Link>
  );
}

/* ──────────────────────────────────────────────── */
/* Drawer Link (card style)                        */
/* ──────────────────────────────────────────────── */
function DrawerLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
    >
      <span className="text-white/70">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={14} className="text-white/30" />
    </Link>
  );
}