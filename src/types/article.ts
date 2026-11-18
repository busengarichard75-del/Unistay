// src/types/article.ts

export interface Article {
  id: string;
  title: string;
  slug: string;         // e.g. "how-to-find-a-room-at-unza"
  excerpt: string;      // Short description for the list page
  content: string;      // The main text (supports basic spacing)
  coverImage?: string;  // Cloudinary URL
  author: string;       // e.g. "Busenga Technologies"
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

// Helper to generate a URL-friendly slug from a title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove special characters
    .replace(/[\s_-]+/g, "-") // replace spaces with hyphens
    .replace(/^-+|-+$/g, ""); // trim hyphens from ends
}