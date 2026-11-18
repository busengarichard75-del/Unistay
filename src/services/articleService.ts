// src/services/articleService.ts
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Article } from "@/types/article";

const articlesRef = collection(db, "articles");

export async function getPublishedArticles(): Promise<Article[]> {
  try {
    const q = query(
      articlesRef,
      where("published", "==", true),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
  } catch (error) {
    console.error("Failed to fetch published articles:", error);
    return [];
  }
}

export async function getAllArticles(): Promise<Article[]> {
  try {
    const q = query(articlesRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Article));
  } catch (error) {
    console.error("Failed to fetch all articles:", error);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const q = query(articlesRef, where("slug", "==", slug), where("published", "==", true));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Article;
  } catch (error) {
    console.error("Failed to fetch article by slug:", error);
    return null;
  }
}

export async function createArticle(data: Omit<Article, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const payload: any = {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // ⭐ FIX: Strip undefined or empty strings so Firestore doesn't crash
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === "") {
        delete payload[key];
      }
    });

    const docRef = await addDoc(articlesRef, payload);
    return docRef.id;
  } catch (error) {
    console.error("Failed to create article:", error);
    throw error;
  }
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<void> {
  try {
    const payload: any = {
      ...data,
      updatedAt: Date.now(),
    };

    // ⭐ FIX: Strip undefined or empty strings
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === "") {
        delete payload[key];
      }
    });

    await updateDoc(doc(db, "articles", id), payload);
  } catch (error) {
    console.error("Failed to update article:", error);
    throw error;
  }
}

export async function deleteArticle(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "articles", id));
  } catch (error) {
    console.error("Failed to delete article:", error);
    throw error;
  }
}