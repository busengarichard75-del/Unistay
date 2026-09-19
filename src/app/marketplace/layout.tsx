import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Marketplace",

  description:
    "Buy and sell with students near your campus — phones, electronics, books, fashion, gaming, furniture, and more. Flash deals daily. Free listings for students.",

  keywords: [
    "student marketplace Zambia",
    "buy phone Zambia",
    "used laptops students",
    "sell books campus",
    "second hand electronics",
    "student deals",
    "campus marketplace",
  ],

  alternates: {
    canonical: "/marketplace",
  },

  openGraph: {
    type: "website",
    siteName: "Peza",
    title: "Student Marketplace | Peza",
    description:
      "Phones, electronics, books, fashion, gaming, furniture — buy and sell with students near your campus. Flash deals daily.",
    url: "/marketplace",
    images: [
      {
        url: "/og-marketplace.png",
        width: 1200,
        height: 630,
        alt: "Peza Marketplace — buy and sell with students near you",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Student Marketplace | Peza",
    description:
      "Phones, electronics, books, fashion, gaming, furniture — buy and sell with students near your campus.",
    images: ["/og-marketplace.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}