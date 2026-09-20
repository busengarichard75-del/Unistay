import type { Metadata } from "next";
import { getFirestoreDb } from "@/lib/firebase-admin";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";

interface LibraryDoc {
  title?: string;
  description?: string;
  category?: "past_papers" | "notes" | "summaries" | "guides";
  universityId?: string;
  courseCode?: string;
  year?: string;
  semester?: string;
  driveLink?: string;
  coverImageUrl?: string;
  uploaderName?: string;
  status?: "pending" | "approved" | "rejected" | "hidden";
  adminHidden?: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  past_papers: "Past Papers",
  notes: "Notes",
  summaries: "Summaries",
  guides: "Study Guides",
};

async function fetchLibraryEntry(id: string): Promise<LibraryDoc | null> {
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("library").doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as LibraryDoc;
    if (data.adminHidden) return null;
    if (data.status !== "approved") return null;
    return data;
  } catch {
    return null;
  }
}

function buildMetaLine(entry: LibraryDoc): string {
  const parts: string[] = [];
  if (entry.courseCode) parts.push(entry.courseCode);
  if (entry.year) parts.push(entry.year);
  if (entry.semester) parts.push(`Sem ${entry.semester}`);
  return parts.join(" · ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entry = await fetchLibraryEntry(id);

  if (!entry) {
    return {
      title: "Material not found",
      description:
        "This study material is unavailable. Browse other free materials in the Peza Library.",
      alternates: { canonical: `/library/${id}` },
      robots: { index: false, follow: true },
    };
  }

  const title = entry.title || "Study material";
  const categoryLabel = entry.category
    ? CATEGORY_LABEL[entry.category]
    : "Study material";
  const metaLine = buildMetaLine(entry);

  const richTitle = metaLine ? `${title} (${metaLine})` : title;

  const description = entry.description
    ? entry.description.slice(0, 150) +
      (entry.description.length > 150 ? "…" : "")
    : `${categoryLabel}${metaLine ? ` — ${metaLine}` : ""}. Shared by ${
        entry.uploaderName || "a student"
      } on Peza Library.`;

  const image = entry.coverImageUrl || "/og-library.png";

  return {
    title: richTitle,
    description,
    alternates: { canonical: `/library/${id}` },
    openGraph: {
      type: "article",
      siteName: "Peza",
      title: `${richTitle} | Peza Library`,
      description,
      url: `/library/${id}`,
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
      title: `${richTitle} | Peza Library`,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * JSON-LD — LearningResource schema for Google rich results.
 * If no cover image, we skip the image field (Google handles absence gracefully).
 */
function libraryJsonLd(id: string, e: LibraryDoc) {
  const categoryLabel = e.category
    ? CATEGORY_LABEL[e.category]
    : "Study material";

  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: e.title,
    description: e.description,
    learningResourceType: categoryLabel,
    educationalLevel: "university",
    inLanguage: "en",
    isAccessibleForFree: true,
    image: e.coverImageUrl || undefined,
    author: e.uploaderName
      ? { "@type": "Person", name: e.uploaderName }
      : undefined,
    provider: {
      "@type": "Organization",
      name: "Peza",
      url: SITE_URL,
    },
    keywords: [e.courseCode, e.year, e.semester, categoryLabel]
      .filter(Boolean)
      .join(", "),
    url: `${SITE_URL}/library/${id}`,
  };
}

export default async function LibraryDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await fetchLibraryEntry(id);

  return (
    <>
      {entry && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(libraryJsonLd(id, entry)),
          }}
        />
      )}
      {children}
    </>
  );
}