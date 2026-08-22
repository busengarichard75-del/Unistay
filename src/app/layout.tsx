import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "UniStayZM – Student Accommodation Platform",
  description: "Find safe, affordable student housing near your campus in Zambia.",
  icons: {
    icon: "data:image/svg+xml," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="12" fill="#1A365D"/>
        <path d="M32 10 L8 28 L12 28 L12 56 L52 56 L52 28 L56 28 L32 10Z" fill="#4A90D9" stroke="white" stroke-width="2"/>
        <rect x="22" y="32" width="20" height="24" fill="white" rx="2"/>
        <text x="32" y="46" font-family="Arial" font-weight="bold" font-size="18" fill="#1A365D" text-anchor="middle">U</text>
        <text x="32" y="58" font-family="Arial" font-weight="bold" font-size="10" fill="#4A90D9" text-anchor="middle">ZM</text>
      </svg>
    `),
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
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}