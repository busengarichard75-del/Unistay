// src/app/robots.ts
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pezazm.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
      {
        // Explicitly allow AI and Search Bots to index your articles/guides
        userAgent: [
          "GPTBot", 
          "OAI-SearchBot", 
          "ChatGPT-User", 
          "Claude-Web", 
          "PerplexityBot", 
          "Googlebot", 
          "Bingbot",
          "Google-Extended" // Added for Gemini AI
        ],
        allow: [
          "/", 
          "/about/busenga-technologies", 
          "/legal",
          "/guides",      // ⭐ Added for Articles
          "/articles"     // ⭐ Added for Articles
        ],
        disallow: ["/api/", "/admin/", "/dashboard/"],
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}