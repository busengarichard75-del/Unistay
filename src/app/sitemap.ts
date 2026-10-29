import { MetadataRoute } from "next";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { getAllProperties } from "@/services/propertyService";
import { universities } from "@/data/universities";
import { GUIDES } from "@/data/guides"; // ⚡ Imported Guides

export const revalidate = 3600;

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
    process.env.NEXT_PUBLIC_APP_URL || "https://pezazm.com";
  const now = new Date();

  // ─── Static public pages ───
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`,                  priority: 1.0, changeFrequency: "daily" },
    { url: `${baseUrl}/services`,         priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/marketplace`,      priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/library`,          priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/guides`,           priority: 0.9, changeFrequency: "weekly" }, // ⚡ Added
    { url: `${baseUrl}/map`,              priority: 0.8, changeFrequency: "weekly" },
    { url: `${baseUrl}/why-peza`,         priority: 0.6, changeFrequency: "monthly" },
    { url: `${baseUrl}/help`,             priority: 0.5, changeFrequency: "monthly" },
    { url: `${baseUrl}/legal`,            priority: 0.3, changeFrequency: "yearly" },
  ].map((p) => ({
    ...p,
    lastModified: now,
  })) as MetadataRoute.Sitemap;

  // ─── Campus Housing Landing Pages ───
  const housingPages: MetadataRoute.Sitemap = universities
    .filter((u) => u.isAvailable)
    .map((u) => ({
      url: `${baseUrl}/housing/${u.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // ─── Guides (Blog) ───
  const guidePages: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  let db;
  try {
    db = getFirestoreDb();
  } catch {
    return [...staticPages, ...housingPages, ...guidePages];
  }

  // ─── Properties ───
  let propertyPages: MetadataRoute.Sitemap = [];
  try {
    const properties = await withTimeout(getAllProperties());
    if (properties) {
      propertyPages = properties
        .filter((p) => !(p as any).adminHidden)
        .map((property) => ({
          url: `${baseUrl}/property/${property.id}`,
          lastModified: property.updatedAt ? new Date(property.updatedAt) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch properties:", error);
  }

  // ─── Services ───
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
            lastModified: d.updatedAt ? new Date(d.updatedAt) : d.createdAt ? new Date(d.createdAt) : new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.6,
          };
        });
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch services:", error);
  }

  // ─── Products ───
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
            lastModified: d.updatedAt ? new Date(d.updatedAt) : d.createdAt ? new Date(d.createdAt) : new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.6,
          };
        });
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch products:", error);
  }

  // ─── Library ───
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
            lastModified: d.updatedAt ? new Date(d.updatedAt) : d.createdAt ? new Date(d.createdAt) : new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          };
        });
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch library entries:", error);
  }

  // ─── Providers ───
  let providerPages: MetadataRoute.Sitemap = [];
  try {
    const snap = await withTimeout(
      db.collection("users").where("role", "==", "service_provider").get()
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

  return [
    ...staticPages,
    ...housingPages,
    ...guidePages,
    ...propertyPages,
    ...servicePages,
    ...productPages,
    ...libraryPages,
    ...providerPages,
  ];
}