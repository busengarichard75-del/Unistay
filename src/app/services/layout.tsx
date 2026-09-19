import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services near you",

  description:
    "Browse trusted student services near your campus — barbers, printing, food, gyms, delivery, photography, and more. Verified providers. Contact directly on WhatsApp.",

  keywords: [
    "student services Zambia",
    "barber near campus",
    "printing services",
    "food delivery students",
    "gym near campus",
    "campus services",
    "student marketplace",
  ],

  alternates: {
    canonical: "/services",
  },

  openGraph: {
    type: "website",
    siteName: "Peza",
    title: "Services near you | Peza",
    description:
      "Barbers, printing, food, gyms, delivery, photography — trusted student services from verified providers, all near your campus.",
    url: "/services",
    images: [
      {
        url: "/og-services.png",
        width: 1200,
        height: 630,
        alt: "Peza Services — trusted student services near your campus",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Services near you | Peza",
    description:
      "Barbers, printing, food, gyms, delivery, photography — trusted student services from verified providers.",
    images: ["/og-services.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}