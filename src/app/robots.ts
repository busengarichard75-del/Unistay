// src/app/robots.ts
import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://peza-zm.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Private / auth pages
          "/api/",
          "/admin/",
          "/admin",
          "/dashboard/",
          "/dashboard",
          "/login",
          "/signup",
          "/signup/provider",
          "/forgot-password",
          "/verify/",
          "/booking/",
          "/saved",
          "/library/new",
          "/library/my-uploads",
          "/library/admin",
          "/find-my-best-house/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}