import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // ⚡ Added for Peza Cloudinary uploads
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com", // ⚡ Added just in case
      },
    ],
  },
};

export default nextConfig;