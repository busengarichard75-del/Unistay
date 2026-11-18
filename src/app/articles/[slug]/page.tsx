// src/app/articles/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getArticleBySlug } from "@/services/articleService";
import { Article } from "@/types/article";
import { optimizeCardImage } from "@/lib/imageUrl";
import { ArrowLeft, Clock, User, RefreshCw, MessageCircle } from "lucide-react";

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const data = await getArticleBySlug(slug);
        if (!data) {
          router.push("/articles");
          return;
        }
        setArticle(data);
      } catch {
        // silent
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [slug, router]);

  if (isFetching) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--nexora-surface)]">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
      </main>
    );
  }

  if (!article) return null;

  const cover = article.coverImage ? optimizeCardImage(article.coverImage) : null;
  const formattedDate = new Date(article.createdAt).toLocaleDateString("en-ZM", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleWhatsAppShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Check out this article on Peza ZM: ${article.title}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium py-8 flex-1">
        <div className="mb-6">
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} /> Back to all articles
          </Link>
        </div>

        <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100">
          {cover && (
            <div className="aspect-[21/9] w-full bg-gray-100">
              <img src={cover} alt={article.title} className="h-full w-full object-cover" />
            </div>
          )}
          
          <div className="p-6 sm:p-10">
            <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
              {article.title}
            </h1>
            
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <User size={16} className="text-blue-500" /> {article.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={16} /> {formattedDate}
                </span>
              </div>
              
              {/* WhatsApp Share Button */}
              <button
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <MessageCircle size={16} fill="currentColor" /> Share
              </button>
            </div>

            <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-gray-700">
              {article.content}
            </div>
            
            {/* Bottom Share CTA */}
            <div className="mt-12 rounded-2xl bg-blue-50 border border-blue-100 p-6 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Did you find this helpful?</h3>
              <p className="text-sm text-gray-600 mb-4">Share it with your classmates so they don't miss out.</p>
              <button
                onClick={handleWhatsAppShare}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                <MessageCircle size={18} fill="currentColor" /> Share on WhatsApp
              </button>
            </div>
          </div>
        </article>
      </div>

      <Footer />
    </main>
  );
}