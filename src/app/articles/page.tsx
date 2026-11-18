// src/app/articles/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { getPublishedArticles } from "@/services/articleService";
import { Article } from "@/types/article";
import { optimizeCardImage } from "@/lib/imageUrl";
import { timeAgo } from "@/lib/timeUtils";
import { ArrowRight, Newspaper, RefreshCw } from "lucide-react";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPublishedArticles();
        setArticles(data);
      } catch {
        // silent
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-[var(--nexora-surface)]">
      <Navbar />

      <div className="container-medium py-10 flex-1">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Newspaper size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--nexora-navy)] sm:text-4xl">
            Peza Insights
          </h1>
          <p className="mt-2 text-gray-500 max-w-lg mx-auto">
            News, campus guides, and announcements from Busenga Technologies.
          </p>
        </div>

        {isFetching ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-20 text-center">
            <Newspaper size={40} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-800">No articles yet</h3>
            <p className="mt-2 text-sm text-gray-500">Check back soon for campus insights and news.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article) => {
              const cover = article.coverImage ? optimizeCardImage(article.coverImage) : null;
              
              return (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                    {cover ? (
                      <img
                        src={cover}
                        alt={article.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Newspaper size={36} className="text-white/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                      {timeAgo(article.createdAt)}
                    </p>
                    <h2 className="text-base font-bold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="mt-auto pt-3 flex items-center text-xs font-semibold text-blue-600">
                      Read <ArrowRight size={12} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}