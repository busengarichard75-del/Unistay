// src/app/housing/[university]/layout.tsx

import type { Metadata } from "next";
import { universities } from "@/data/universities";
import { getUniversityFullName } from "@/lib/universityLabels";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pezazm.com";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ university: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ university: string }>;
}): Promise<Metadata> {
  const { university } = await params;
  
  // Get the nice name (e.g., "unza" -> "University of Zambia (UNZA)")
  const uniName = getUniversityFullName(university) || university.toUpperCase();
  
  const title = `Student Accommodation near ${uniName} | Peza`;
  const description = `Find verified rooms, hostels, and bed spaces near ${uniName}. Browse student housing with prices, locations, and contact landlords directly on Peza.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/housing/${university}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/housing/${university}`,
      siteName: "Peza",
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: title }],
    },
  };
}

export default function HousingLayout({ children }: LayoutProps) {
  return <>{children}</>;
}