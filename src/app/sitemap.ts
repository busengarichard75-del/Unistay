// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { getFirestoreDb } from "@/lib/firebase-admin";
import { getAllProperties } from "@/services/propertyService";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";

  // ─── Static pages ───
  const staticPages = [
    "",
    "/login",
    "/signup",
    "/help",
    "/legal",
    "/dashboard/student",
    "/dashboard/landlord",
    "/admin",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  // ─── Dynamic property pages ───
  let propertyPages: MetadataRoute.Sitemap = [];
  try {
    const properties = await getAllProperties();
    propertyPages = properties.map((property) => ({
      url: `${baseUrl}/property/${property.id}`,
      lastModified: property.updatedAt ? new Date(property.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Failed to fetch properties for sitemap:", error);
  }

  // ─── Booking confirmation pages (optional) ───
  let bookingPages: MetadataRoute.Sitemap = [];
  try {
    const db = getFirestoreDb();
    const bookingsSnapshot = await db.collection("bookings").limit(100).get();
    bookingPages = bookingsSnapshot.docs.map((doc) => ({
      url: `${baseUrl}/booking/confirmation/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: "never" as const,
      priority: 0.3,
    }));
  } catch (error) {
    console.error("Failed to fetch bookings for sitemap:", error);
  }

  return [...staticPages, ...propertyPages, ...bookingPages];
}