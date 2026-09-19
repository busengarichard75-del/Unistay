import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "sonner";
import { AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import { WelcomeModal } from "@/components/WelcomeModal";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

// ─────────────────────────────────────────────────────────
// SITE URL — matches your existing env var (NEXT_PUBLIC_APP_URL),
// with production fallback. Every child layout inherits via metadataBase.
// ─────────────────────────────────────────────────────────
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";

const DEFAULT_TITLE = "Peza — Find what you need on campus";
const DEFAULT_DESCRIPTION =
  "Accommodation, services, and marketplace for Zambian students. Find rooms near your campus, book a barber, buy a phone — all in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: DEFAULT_TITLE,
    template: "%s | Peza",
  },

  description: DEFAULT_DESCRIPTION,

  keywords: [
    "Peza",
    "student accommodation Zambia",
    "student housing",
    "campus rooms",
    "student marketplace",
    "student services",
    "MUKUBA",
    "UNZA",
    "CBU",
    "hostels near campus",
  ],

  authors: [{ name: "Peza" }],
  creator: "Peza",
  publisher: "Peza",

  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    siteName: "Peza",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    locale: "en_ZM",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Peza — Find what you need on campus",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-default.png"],
    creator: "@peza",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  applicationName: "Peza",
  category: "marketplace",
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans")}
    >
      <body className="min-h-full flex flex-col bg-[var(--nexora-surface)]">
        <ErrorBoundary>
          <AuthProvider>
            <NetworkStatus />
            <AnalyticsTracker />
            <AnimatePresence mode="wait" initial={false}>
              {children}
            </AnimatePresence>
            <Toaster position="bottom-right" richColors closeButton />
            <WelcomeModal />
            <FloatingWhatsAppButton />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}