import { MetadataRoute } from "next";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { getAllProperties } from "@/services/propertyService";

export const revalidate = 3600;

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

  const db = getFirestoreDb();

  // ─── Properties ───
  let propertyPages: MetadataRoute.Sitemap = [];
  try {
    const properties = await getAllProperties();
    propertyPages = properties.map((property) => ({
      url: `${baseUrl}/property/${property.id}`,
      lastModified: property.updatedAt
        ? new Date(property.updatedAt)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Sitemap: failed to fetch properties:", error);
  }

  // ─── Services (visible only) ───
  let servicePages: MetadataRoute.Sitemap = [];
  try {
    const snap = await db.collection("services").get();
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
  } catch (error) {
    console.error("Sitemap: failed to fetch services:", error);
  }

  // ─── Products (available only) ───
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const snap = await db.collection("products").get();
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
  } catch (error) {
    console.error("Sitemap: failed to fetch products:", error);
  }

  // ─── Library entries (approved + not hidden) ───
  let libraryPages: MetadataRoute.Sitemap = [];
  try {
    const snap = await db.collection("library").get();
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
  } catch (error) {
    console.error("Sitemap: failed to fetch library entries:", error);
  }

  // ─── Provider profiles (approved only) ───
  let providerPages: MetadataRoute.Sitemap = [];
  try {
    const snap = await db
      .collection("users")
      .where("role", "==", "service_provider")
      .get();
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
  } catch (error) {
    console.error("Sitemap: failed to fetch providers:", error);
  }

  // ─── Booking confirmation pages ───
  let bookingPages: MetadataRoute.Sitemap = [];
  try {
    const bookingsSnapshot = await db
      .collection("bookings")
      .limit(100)
      .get();
    bookingPages = bookingsSnapshot.docs.map((doc) => ({
      url: `${baseUrl}/booking/confirmation/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: "never" as const,
      priority: 0.1,
    }));
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