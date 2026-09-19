import type { Metadata } from "next";
import { getFirestoreDb } from "@/lib/firebase-admin";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://peza.vercel.app";

interface ProductDoc {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  condition?: "new" | "like_new" | "used" | "for_parts";
  status?: "available" | "sold";
  imageUrls?: string[];
  location?: string;
  universityId?: string;
  adminHidden?: boolean;
  discountPercent?: number;
  discountExpiresAt?: number;
}

const CONDITION_LABEL: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  used: "Used",
  for_parts: "For Parts",
};

async function fetchProduct(id: string): Promise<ProductDoc | null> {
  try {
    const db = getFirestoreDb();
    const snap = await db.collection("products").doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as ProductDoc;
    if (data.adminHidden) return null;
    return data;
  } catch {
    return null;
  }
}

function effectivePrice(p: ProductDoc): number {
  const base = p.price ?? 0;
  const hasDiscount =
    !!p.discountPercent &&
    p.discountPercent > 0 &&
    !!p.discountExpiresAt &&
    p.discountExpiresAt > Date.now();
  if (!hasDiscount) return base;
  return Math.round(base * (1 - (p.discountPercent as number) / 100));
}

function ogImageFor(p: ProductDoc | null): string {
  const first = p?.imageUrls?.[0];
  if (first) return first;
  return "/og-marketplace.png";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return {
      title: "Product not found",
      description:
        "This listing is no longer available. Browse other deals on the Peza Marketplace.",
      alternates: { canonical: `/marketplace/${id}` },
      robots: { index: false, follow: true },
    };
  }

  const name = product.name || "Product";
  const price = effectivePrice(product);
  const conditionLabel = product.condition
    ? CONDITION_LABEL[product.condition]
    : "";

  const titleParts = [`K${price.toLocaleString()}`];
  if (conditionLabel) titleParts.push(conditionLabel);
  const title = `${name} — ${titleParts.join(" · ")}`;

  const description = product.description
    ? product.description.slice(0, 150) +
      (product.description.length > 150 ? "…" : "")
    : `${name} for K${price.toLocaleString()}${conditionLabel ? ` (${conditionLabel})` : ""} in ${product.location || "your campus"}. Contact directly on WhatsApp.`;

  const image = ogImageFor(product);

  return {
    title,
    description,
    alternates: { canonical: `/marketplace/${id}` },
    openGraph: {
      type: "website",
      siteName: "Peza",
      title: `${title} | Peza`,
      description,
      url: `/marketplace/${id}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Peza`,
      description,
      images: [image],
    },
    robots: {
      index: product.status === "available",
      follow: true,
    },
  };
}

function productJsonLd(id: string, p: ProductDoc) {
  const price = effectivePrice(p);
  const conditionLabel = p.condition ? CONDITION_LABEL[p.condition] : "";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.imageUrls?.length ? p.imageUrls : undefined,
    category: p.category,
    itemCondition: p.condition
      ? `https://schema.org/${
          p.condition === "new"
            ? "NewCondition"
            : p.condition === "like_new"
            ? "UsedCondition"
            : p.condition === "used"
            ? "UsedCondition"
            : "DamagedCondition"
        }`
      : undefined,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "ZMW",
      availability:
        p.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/marketplace/${id}`,
      itemCondition: conditionLabel || undefined,
    },
    url: `${SITE_URL}/marketplace/${id}`,
  };
}

export default async function ProductDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd(id, product)),
          }}
        />
      )}
      {children}
    </>
  );
}