import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Library",

  description:
    "Free study materials for Zambian students — past papers, notes, summaries, and study guides. Shared by students, for students. Browse by university and course.",

  keywords: [
    "student library Zambia",
    "past papers Zambia",
    "free study notes",
    "university past papers",
    "student study materials",
    "MUKUBA past papers",
    "UNZA notes",
    "CBU study guides",
  ],

  alternates: {
    canonical: "/library",
  },

  openGraph: {
    type: "website",
    siteName: "Peza",
    title: "Student Library | Peza",
    description:
      "Free past papers, notes, summaries, and study guides — shared by students, for students.",
    url: "/library",
    images: [
      {
        url: "/og-library.png",
        width: 1200,
        height: 630,
        alt: "Peza Library — free study materials from students",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Student Library | Peza",
    description:
      "Free past papers, notes, summaries, and study guides — shared by students, for students.",
    images: ["/og-library.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}