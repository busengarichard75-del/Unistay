// src/app/guides/[slug]/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { GUIDES, getGuideBySlug } from "@/data/guides";
import { ArrowLeft, Clock, Calendar } from "lucide-react";

// This tells Next.js to pre-render all guide pages at build time for maximum speed!
export async function generateStaticParams() {
  return GUIDES.map((guide) => ({
    slug: guide.slug,
  }));
}

// Dynamic SEO metadata for each article
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return { title: "Guide not found" };
  }

  return {
    title: `${guide.title} | Peza`,
    description: guide.excerpt,
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      type: "article",
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium flex-1 py-10">
        <Link
          href="/guides"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-[var(--nexora-navy)]"
        >
          <ArrowLeft size={16} />
          Back to all guides
        </Link>

        <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {/* Article Header */}
          <div className="bg-gradient-to-br from-indigo-50 to-white px-6 py-10 text-center sm:px-12 sm:py-14">
            <h1 className="text-2xl font-extrabold leading-tight text-[var(--nexora-navy)] sm:text-3xl">
              {guide.title}
            </h1>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {guide.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {guide.readTime}
              </span>
            </div>
          </div>

          {/* Article Body */}
          <div className="px-6 py-8 sm:px-12 sm:py-10">
            <div 
              className="prose prose-sm sm:prose-base prose-indigo max-w-none prose-headings:text-[var(--nexora-navy)] prose-a:text-[var(--nexora-primary)]"
              dangerouslySetInnerHTML={{ __html: guide.content }} 
            />
          </div>

          {/* Call to Action Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-8 text-center sm:px-12">
            <h3 className="text-lg font-bold text-[var(--nexora-navy)]">
              Ready to find a place?
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Browse verified student accommodation near your campus.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/housing/unza"
                className="rounded-full bg-[var(--nexora-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105"
              >
                View UNZA Housing
              </Link>
              <Link
                href="/"
                className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Explore All Campuses
              </Link>
            </div>
          </div>
        </article>
      </div>

      <Footer />
    </main>
  );
}