import { MetadataRoute } from "next";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { getAllProperties } from "@/services/propertyService";

// Revalidate hourly — sitemap only needs to be fresh enough for Google.
export const revalidate = 3600;

/**
 * ⚡ TIMEOUT GUARD
 * Sitemap does 6 sequential Firestore reads. Without timeouts, one slow
 * collection can hang the whole sitemap → Google gets a 500 → pages stop
 * being indexed. Race every read against a 3s timeout.
 * On timeout we return an empty list for that section (sitemap still builds).
 */
const FIRESTORE_TIMEOUT_MS = 3000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number = FIRESTORE_TIMEOUT_MS
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";
  const now = new Date();

  // ─── Static pages ───
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`,                  priority: 1.0, changeFrequency: "daily" },
    { url: `${baseUrl}/services`,         priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/marketplace`,      priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/library`,          priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/map`,              priority: 0.8, changeFrequency: "weekly" },
    { url: `${baseUrl}/help`,             priority: 0.5, changeFrequency: "monthly" },
    { url: `${baseUrl}/legal`,            priority: 0.3, changeFrequency: "yearly" },
    { url: `${baseUrl}/signup`,           priority: 0.6, changeFrequency: "monthly" },
    { url: `${baseUrl}/signup/provider`,  priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/login`,            priority: 0.4, changeFrequency: "monthly" },
    { url: `${baseUrl}/forgot-password`,  priority: 0.3, changeFrequency: "yearly" },
  ].map((p) => ({
    ...p,
    lastModified: now,
  })) as MetadataRoute.Sitemap;

  let db;
  try {
    db = getFirestoreDb();
  } catch {
    // Admin SDK failed to init → return static pages only
    return staticPages;
  }

  // ─── Properties ───
  let propertyPages: MetadataRoute.Sitemap = [];
  try {
    const properties = await withTimeout(getAllProperties());
    if (properties) {
      propertyPages = properties.map((property) => ({
        url: `${baseUrl}/property/${property.id}`,
        lastModified: property.updatedAt
          ? new Date(property.updatedAt)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch properties:", error);
  }

  // ─── Services (visible only) ───
  let servicePages: MetadataRoute.Sitemap = [];
  try {
    const snap = await withTimeout(db.collection("services").get());
    if (snap) {
      servicePages = snap.docs
        .filter((doc) => {
          const d = doc.data();
          return !d.adminHidden && d.status === "available";
        })
        .map((doc) => {
          const d = doc.data();
          return {
            url: `${baseUrl}/services/${doc.id}`,
            lastModified: d.updatedAt
              ? new Date(d.updatedAt)
              : d.createdAt
              ? new Date(d.createdAt)
              : new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.6,
          };
        });
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch services:", error);
  }

  // ─── Products (available only) ───
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const snap = await withTimeout(db.collection("products").get());
    if (snap) {
      productPages = snap.docs
        .filter((doc) => {
          const d = doc.data();
          return !d.adminHidden && d.status === "available";
        })
        .map((doc) => {
          const d = doc.data();
          return {
            url: `${baseUrl}/marketplace/${doc.id}`,
            lastModified: d.updatedAt
              ? new Date(d.updatedAt)
              : d.createdAt
              ? new Date(d.createdAt)
              : new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.6,
          };
        });
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch products:", error);
  }

  // ─── Library entries (approved + not hidden) ───
  let libraryPages: MetadataRoute.Sitemap = [];
  try {
    const snap = await withTimeout(db.collection("library").get());
    if (snap) {
      libraryPages = snap.docs
        .filter((doc) => {
          const d = doc.data();
          return !d.adminHidden && d.status === "approved";
        })
        .map((doc) => {
          const d = doc.data();
          return {
            url: `${baseUrl}/library/${doc.id}`,
            lastModified: d.updatedAt
              ? new Date(d.updatedAt)
              : d.createdAt
              ? new Date(d.createdAt)
              : new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          };
        });
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch library entries:", error);
  }

  // ─── Provider profiles (approved only) ───
  let providerPages: MetadataRoute.Sitemap = [];
  try {
    const snap = await withTimeout(
      db
        .collection("users")
        .where("role", "==", "service_provider")
        .get()
    );
    if (snap) {
      providerPages = snap.docs
        .filter((doc) => {
          const d = doc.data();
          return d.verificationStatus === "approved" && !d.suspended;
        })
        .map((doc) => {
          const d = doc.data();
          return {
            url: `${baseUrl}/provider/${doc.id}`,
            lastModified: d.createdAt ? new Date(d.createdAt) : new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.5,
          };
        });
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch providers:", error);
  }

  // ─── Booking confirmation pages ───
  let bookingPages: MetadataRoute.Sitemap = [];
  try {
    const bookingsSnapshot = await withTimeout(
      db.collection("bookings").limit(100).get()
    );
    if (bookingsSnapshot) {
      bookingPages = bookingsSnapshot.docs.map((doc) => ({
        url: `${baseUrl}/booking/confirmation/${doc.id}`,
        lastModified: new Date(),
        changeFrequency: "never" as const,
        priority: 0.1,
      }));
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch bookings:", error);
  }

  return [
    ...staticPages,
    ...propertyPages,
    ...servicePages,
    ...productPages,
    ...libraryPages,
    ...providerPages,
    ...bookingPages,
  ];
}