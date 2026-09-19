import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listing overview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LandlordListingDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}