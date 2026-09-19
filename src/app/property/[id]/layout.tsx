import type { Metadata } from "next";
import { getFirestoreDb } from "@/lib/firebase-admin";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";

interface PropertyDoc {
  title?: string;
  price?: number;
  paymentPeriod?: "monthly" | "termly" | "semester";
  genderPreference?: "male" | "female" | "mixed";
  distanceBucket?: "under5" | "5to15" | "15to30" | "over30";
  amenities?: {
    electricity?: boolean;
    water?: boolean;
    security?: boolean;
  };
  additionalAmenities?: string[];
  location?: string;
  universityId?: string;
  imageUrl?: string;
  imageUrls?: string[];
  bedSpaces?: { isAvailable?: boolean; type?: "Top" | "Bottom" }[];
  isActive?: boolean;
  adminHidden?: boolean;
  verificationStatus?: "pending" | "approved" | "rejected";
  createdAt?: number;
}

const PERIOD_LABEL: Record<string, string> = {
  monthly: "/mo",
  termly: "/term",
  semester: "/semester",
};

const DISTANCE_LABEL: Record<string, string> = {
  under5: "under 5 min from campus",
  "5to15": "5–15 min from campus",
  "15to30": "15–30 min from campus",
  over30: "30+ min from campus",
};

async function fetchProperty(id: string): Promise<PropertyDoc | null> {
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("properties").doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as PropertyDoc;
    if (data.adminHidden) return null;
    if (data.isActive === false) return null;
    return data;
  } catch {
    return null;
  }
}

function availableBeds(p: PropertyDoc): number {
  return (p.bedSpaces ?? []).filter((b) => b.isAvailable).length;
}

function totalBeds(p: PropertyDoc): number {
  return (p.bedSpaces ?? []).length;
}

function ogImageFor(p: PropertyDoc | null): string {
  const first = p?.imageUrls?.[0] || p?.imageUrl;
  if (first) return first;
  return "/og-property.png";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await fetchProperty(id);

  if (!property) {
    return {
      title: "Property not found",
      description:
        "This property is no longer available. Browse other student accommodation on Peza.",
      alternates: { canonical: `/property/${id}` },
      robots: { index: false, follow: true },
    };
  }

  const title = property.title || "Student accommodation";
  const price = property.price ?? 0;
  const period = property.paymentPeriod
    ? PERIOD_LABEL[property.paymentPeriod] || ""
    : "";
  const beds = availableBeds(property);
  const distance = property.distanceBucket
    ? DISTANCE_LABEL[property.distanceBucket]
    : "";

  const titleParts = [`K${price.toLocaleString()}${period}`];
  if (beds > 0) titleParts.push(`${beds} bed${beds === 1 ? "" : "s"} available`);
  const richTitle = `${title} — ${titleParts.join(" · ")}`;

  const facts: string[] = [];
  if (distance) facts.push(distance);
  if (property.location) facts.push(property.location);
  if (property.genderPreference && property.genderPreference !== "mixed") {
    facts.push(`${property.genderPreference} only`);
  }

  const description = property.title
    ? `${title} — ${titleParts.join(" · ")}.${
        facts.length ? ` ${facts.join(", ")}.` : ""
      } Contact the landlord on Peza.`
    : `${titleParts.join(" · ")} student accommodation${
        property.location ? ` in ${property.location}` : ""
      }. Contact the landlord on Peza.`;

  const image = ogImageFor(property);

  return {
    title: richTitle,
    description,
    alternates: { canonical: `/property/${id}` },
    openGraph: {
      type: "website",
      siteName: "Peza",
      title: `${richTitle} | Peza`,
      description,
      url: `/property/${id}`,
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
      title: `${richTitle} | Peza`,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function propertyJsonLd(id: string, p: PropertyDoc) {
  const price = p.price ?? 0;
  const beds = availableBeds(p);
  const total = totalBeds(p);
  const amenityList: string[] = [];

  if (p.amenities?.electricity) amenityList.push("Electricity");
  if (p.amenities?.water) amenityList.push("Water");
  if (p.amenities?.security) amenityList.push("Security");
  if (p.additionalAmenities) amenityList.push(...p.additionalAmenities);

  return {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: p.title,
    description: p.title
      ? `${p.title} — student accommodation${
          p.location ? ` in ${p.location}` : ""
        }.`
      : undefined,
    image: p.imageUrls?.length
      ? p.imageUrls
      : p.imageUrl
      ? [p.imageUrl]
      : undefined,
    address: p.location
      ? {
          "@type": "PostalAddress",
          addressLocality: p.location,
          addressCountry: "ZM",
        }
      : undefined,
    amenityFeature: amenityList.length
      ? amenityList.map((a) => ({
          "@type": "LocationFeatureSpecification",
          name: a,
          value: true,
        }))
      : undefined,
    numberOfAvailableAccommodationUnits: beds > 0 ? beds : undefined,
    numberOfAccommodationUnits: total > 0 ? total : undefined,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "ZMW",
      availability:
        beds > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/property/${id}`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price,
        priceCurrency: "ZMW",
        unitText: p.paymentPeriod || "monthly",
      },
    },
    url: `${SITE_URL}/property/${id}`,
  };
}

export default async function PropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await fetchProperty(id);

  return (
    <>
      {property && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(propertyJsonLd(id, property)),
          }}
        />
      )}
      {children}
    </>
  );
}