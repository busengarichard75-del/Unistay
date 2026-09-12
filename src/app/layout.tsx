import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "sonner";
import { AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import { WelcomeModal } from "@/components/WelcomeModal";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";

export const metadata: Metadata = {
  title: "Peza Accommodation – Student Housing Platform",
  description: "Find safe, affordable student accommodation near your campus in Zambia.",
  icons: {
    icon: "/favicon.png",
  },
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
            <AnimatePresence mode="wait" initial={false}>
              {children}
            </AnimatePresence>
            <Toaster position="bottom-right" richColors closeButton />
            <WelcomeModal />
            {/* ✅ Floating WhatsApp support button (stacked above Nexora chat) */}
            <FloatingWhatsAppButton />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}