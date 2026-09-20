import type { Metadata } from "next";
import { getFirestoreDb } from "@/lib/firebase-admin";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";

/**
 * ⚡ TIMEOUT GUARD
 * Vercel free tier kills serverless functions at 10s.
 * Firestore cold starts can eat 5-8s → page never responds → "site can't be reached".
 * This races every Firestore call against a 2s timeout.
 * If it times out, we return null → metadata falls back to generic Peza values
 * → page STILL LOADS. Users never wait more than 2s for the server.
 */
const FIRESTORE_TIMEOUT_MS = 2000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number = FIRESTORE_TIMEOUT_MS
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);
}

interface ServiceDoc {
  title?: string;
  description?: string;
  category?: string;
  imageUrls?: string[];
  priceType?: "free" | "from" | "contact";
  priceFrom?: number;
  location?: string;
  universityId?: string;
  isOnline?: boolean;
  status?: string;
  adminHidden?: boolean;
}

async function fetchService(id: string): Promise<ServiceDoc | null> {
  try {
    const db = getFirestoreDb();

    // ⚡ Race the Firestore read against a 2s timeout
    const snap = await withTimeout(
      db.collection("services").doc(id).get()
    );

    // Timeout or error → return null → fallback metadata (page still loads)
    if (!snap || !snap.exists) return null;

    const data = snap.data() as ServiceDoc;
    if (data.adminHidden) return null;
    return data;
  } catch {
    return null;
  }
}

function priceFragment(s: ServiceDoc): string {
  if (s.priceType === "free") return "Free";
  if (s.priceType === "contact") return "Contact for price";
  if (s.priceType === "from" && s.priceFrom) {
    return `From K${s.priceFrom.toLocaleString()}`;
  }
  return "";
}

function ogImageFor(s: ServiceDoc | null): string {
  const first = s?.imageUrls?.[0];
  if (first) return first;
  return "/og-services.png";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await fetchService(id);

  if (!service) {
    return {
      title: "Service not found",
      description:
        "This service is no longer available. Browse other trusted student services on Peza.",
      alternates: { canonical: `/services/${id}` },
      robots: { index: false, follow: true },
    };
  }

  const title = service.title || "Service";
  const price = priceFragment(service);
  const where = service.isOnline
    ? "Online"
    : service.location || "your campus";

  const description = service.description
    ? service.description.slice(0, 150) +
      (service.description.length > 150 ? "…" : "")
    : `${title} — ${price || "Trusted student service"} in ${where}. Contact directly on WhatsApp.`;

  const image = ogImageFor(service);

  return {
    title,
    description,
    alternates: { canonical: `/services/${id}` },
    openGraph: {
      type: "website",
      siteName: "Peza",
      title: `${title}${price ? ` — ${price}` : ""} | Peza`,
      description,
      url: `/services/${id}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Peza`,
      description,
      images: [image],
    },
    robots: {
      index: service.status === "available",
      follow: true,
    },
  };
}

function serviceJsonLd(id: string, s: ServiceDoc) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description,
    image: s.imageUrls?.[0] ? [s.imageUrls[0]] : undefined,
    areaServed: s.isOnline ? "Online" : s.location,
    provider: {
      "@type": "LocalBusiness",
      name: "Peza",
      url: SITE_URL,
    },
    offers:
      s.priceType === "from" && s.priceFrom
        ? {
            "@type": "Offer",
            price: s.priceFrom,
            priceCurrency: "ZMW",
            availability:
              s.status === "available"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url: `${SITE_URL}/services/${id}`,
          }
        : s.priceType === "free"
        ? {
            "@type": "Offer",
            price: 0,
            priceCurrency: "ZMW",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/services/${id}`,
          }
        : undefined,
    url: `${SITE_URL}/services/${id}`,
  };
}

export default async function ServiceDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await fetchService(id);

  return (
    <>
      {service && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(serviceJsonLd(id, service)),
          }}
        />
      )}
      {children}
    </>
  );
}