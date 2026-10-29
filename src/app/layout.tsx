import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import { WelcomeModal } from "@/components/WelcomeModal";
import { PostAuthWelcomeModal } from "@/components/PostAuthWelcomeModal";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { WebVitals } from "@/components/WebVitals";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://pezazm.com";

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
    "Peza", "student accommodation Zambia", "student housing", "campus rooms",
    "student marketplace", "student services", "MUKUBA", "UNZA", "CBU", "hostels near campus",
  ],
  authors: [{ name: "Peza" }],
  creator: "Peza",
  publisher: "Peza",

  // Icons are NOT set here on purpose.
  // Next.js automatically uses favicon.ico, icon.png and apple-icon.png
  // from the src/app folder.

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
  verification: {
    google: "nu7rNbVJIN6RBZ7XYMbEB68xGfvl4z5EIamOAhAeHU4",
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Structured data: tells search engines and AI tools what Peza is
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Peza",
      url: SITE_URL,
      logo: `${SITE_URL}/og-default.png`,
      description: DEFAULT_DESCRIPTION,
      areaServed: { "@type": "Country", name: "Zambia" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Peza",
      description: DEFAULT_DESCRIPTION,
      inLanguage: "en-ZM",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* GA4 loads after the page is interactive so it doesn't slow first load */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-6VCP2PHEB8`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6VCP2PHEB8');
          `}
        </Script>
      </head>

      <body className="min-h-full flex flex-col bg-[var(--nexora-surface)]">
        <ErrorBoundary>
          <AuthProvider>
            <NetworkStatus />
            <AnalyticsTracker />
            <WebVitals />
            {children}
            <Toaster position="bottom-right" richColors closeButton />
            <WelcomeModal />
            <PostAuthWelcomeModal />
            <FloatingWhatsAppButton />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}