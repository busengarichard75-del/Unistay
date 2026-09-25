import type { Metadata } from "next";
import { getFirestoreDb } from "@/lib/firebase-admin";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";

/**
 * ⚡ TIMEOUT GUARD
 * Vercel free tier kills serverless functions at 10s.
 * Firestore cold starts can eat 5-8s → page never responds → "site can't be reached".
 * This races every Firestore call against a 2s timeout.
 * On timeout we return null → metadata falls back to generic values
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

interface ProviderShopSettings {
  bannerUrl?: string;
  tagline?: string;
}

interface ProviderDoc {
  fullName?: string;
  businessName?: string;
  role?: "student" | "landlord" | "service_provider";
  university?: string;
  providerType?: "service" | "product";
  verificationStatus?: "pending" | "approved" | "rejected";
  photoURL?: string;
  suspended?: boolean;
  createdAt?: number;
  // ─── Additive: shop customization for premium preview ───
  shopSettings?: ProviderShopSettings;
}

async function fetchProvider(uid: string): Promise<ProviderDoc | null> {
  try {
    const db = getFirestoreDb();

    // ⚡ Race the Firestore read against a 2s timeout
    const snap = await withTimeout(
      db.collection("users").doc(uid).get()
    );

    if (!snap || !snap.exists) return null;

    const data = snap.data() as ProviderDoc;
    if (data.suspended) return null;
    if (data.role !== "service_provider") return null;
    return data;
  } catch {
    return null;
  }
}

function displayName(p: ProviderDoc | null): string {
  if (!p) return "Peza Provider";
  return p.businessName?.trim() || p.fullName?.trim() || "Peza Provider";
}

/**
 * Pick the best image for the OG preview.
 * Priority: shop banner → avatar → default fallback.
 * Banners are wider (~1600x400) and feel more "shop-like" on WhatsApp.
 */
function ogImageFor(p: ProviderDoc | null): string {
  if (p?.shopSettings?.bannerUrl?.trim()) return p.shopSettings.bannerUrl.trim();
  if (p?.photoURL) return p.photoURL;
  return "/og-providers.png";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uid: string }>;
}): Promise<Metadata> {
  const { uid } = await params;
  const provider = await fetchProvider(uid);

  if (!provider) {
    return {
      title: "Provider not found",
      description:
        "This provider profile is unavailable. Browse trusted student services and products on Peza.",
      alternates: { canonical: `/provider/${uid}` },
      robots: { index: false, follow: true },
    };
  }

  const name = displayName(provider);
  const isVerified = provider.verificationStatus === "approved";
  const typeLabel =
    provider.providerType === "product"
      ? "Student products"
      : provider.providerType === "service"
      ? "Student services"
      : "Student services & products";

  const titleParts = [name];
  if (isVerified) titleParts.push("Verified");
  const title = titleParts.join(" · ");

  // ─── Prefer the shop tagline in the description ───
  const tagline = provider.shopSettings?.tagline?.trim();
  const description =
    tagline ||
    `${
      isVerified ? "Verified provider on Peza. " : ""
    }Browse ${typeLabel.toLowerCase()} from ${name}${
      provider.university ? ` near ${provider.university}` : ""
    }. Contact directly on WhatsApp.`;

  const image = ogImageFor(provider);

  return {
    title,
    description,
    alternates: { canonical: `/provider/${uid}` },
    openGraph: {
      type: "profile",
      siteName: "Peza",
      title: `${title} | Peza`,
      description,
      url: `/provider/${uid}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: name,
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
      index: isVerified,
      follow: true,
    },
  };
}

function providerJsonLd(uid: string, p: ProviderDoc) {
  const name = displayName(p);
  const isStore = p.providerType === "product";

  // Prefer banner for image, fall back to avatar
  const image = ogImageFor(p);
  const absoluteImage = image.startsWith("http")
    ? image
    : `${SITE_URL}${image}`;

  return {
    "@context": "https://schema.org",
    "@type": isStore ? "Store" : "LocalBusiness",
    name,
    image: absoluteImage,
    url: `${SITE_URL}/provider/${uid}`,
    areaServed: p.university || "Zambia",
    address: p.university
      ? {
          "@type": "PostalAddress",
          addressLocality: p.university,
          addressCountry: "ZM",
        }
      : undefined,
    founder: p.fullName
      ? {
          "@type": "Person",
          name: p.fullName,
        }
      : undefined,
    // ─── Additive: use tagline as description in schema.org ───
    description: p.shopSettings?.tagline?.trim() || undefined,
  };
}

export default async function ProviderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const provider = await fetchProvider(uid);

  return (
    <>
      {provider && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(providerJsonLd(uid, provider)),
          }}
        />
      )}
      {children}
    </>
  );
}