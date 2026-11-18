// src/components/admin/tabs/ArticlesTab.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  Plus, Edit, Trash2, EyeOff, FileText, CheckCircle2, XCircle 
} from "lucide-react";
import { Article, generateSlug } from "@/types/article";
import { getAllArticles, createArticle, updateArticle, deleteArticle } from "@/services/articleService";
import { ImageUploader } from "@/components/ui/ImageUploader";

export function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Form state
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);

  const loadArticles = async () => {
    setIsFetching(true);
    try {
      const data = await getAllArticles();
      setArticles(data);
    } catch {
      toast.error("Failed to load articles.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const resetForm = () => {
    setCurrentId(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCoverImage("");
    setPublished(false);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleOpenEdit = (article: Article) => {
    setCurrentId(article.id);
    setTitle(article.title);
    setSlug(article.slug);
    setExcerpt(article.excerpt);
    setContent(article.content);
    setCoverImage(article.coverImage || "");
    setPublished(article.published);
    setIsEditing(true);
  };

  // Auto-generate slug when typing title (only if creating new)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!currentId) {
      setSlug(generateSlug(val));
    }
  };

  const handleSave = async () => {
    // ⭐ FIX: Only Title and Content are strictly required now
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Please fill in the Title and Content.");
      return;
    }

    setIsSaving(true);
    try {
      // ⭐ FIX: Auto-generate excerpt if left blank
      const finalExcerpt = excerpt.trim() || content.trim().substring(0, 150) + "...";

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: finalExcerpt,
        content: content.trim(),
        coverImage: coverImage || undefined,
        published,
        author: "Busenga Technologies",
      };

      if (currentId) {
        await updateArticle(currentId, payload);
        toast.success("Article updated.");
      } else {
        await createArticle(payload);
        toast.success("Article created.");
      }
      
      setIsEditing(false);
      resetForm();
      loadArticles();
    } catch (err) {
      toast.error("Failed to save article.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"?`)) return;
    setBusyId(id);
    try {
      await deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast.success("Article deleted.");
    } catch {
      toast.error("Failed to delete article.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-400" size={20} />
            Articles & Blog
          </h2>
          <p className="text-xs text-gray-400 mt-1">Write PR, SEO articles, and campus guides.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Write Article
        </button>
      </div>

      {isFetching ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-10 text-center">
          <FileText size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">No articles yet. Write your first one to boost SEO!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-white">{article.title}</h3>
                  {article.published ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-900/40 px-2 py-0.5 text-[10px] font-bold text-green-400 border border-green-800/50">
                      <CheckCircle2 size={10} /> LIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-800/50">
                      <EyeOff size={10} /> DRAFT
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  /{article.slug} · {new Date(article.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleOpenEdit(article)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700"
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(article.id, article.title)}
                  disabled={busyId === article.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-900 bg-red-950/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-50"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ EDITOR MODAL ═══ */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
              <h3 className="text-lg font-bold text-white">
                {currentId ? "Edit Article" : "Write New Article"}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-400">Article Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. The Ultimate Guide to Finding a Room at UNZA"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-400">URL Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    placeholder="auto-generated-from-title"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">Cover Image (Optional)</label>
                <ImageUploader initialImage={coverImage} onUpload={(url) => setCoverImage(url)} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">Short Excerpt (Optional - auto-generates if blank)</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  placeholder="A short summary of the article..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-400">Full Content * (Supports line breaks)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder="Write your article here..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 outline-none resize-y"
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="published" className="text-sm font-semibold text-white cursor-pointer">
                    Publish immediately
                  </label>
                  <p className="text-xs text-gray-400">If unchecked, this will be saved as a hidden draft.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 p-4 flex justify-end gap-2 bg-gray-900">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}