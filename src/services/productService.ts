// src/services/productService.ts

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { withRetry, shouldRetryRead } from "@/lib/firestoreRetry";

const productsRef = collection(db, "products");

/**
 * Create a product.
 * ⚠️ Not retried — writes must not run twice.
 */
export async function addProduct(data: Omit<Product, "id">): Promise<string> {
  try {
    const docRef = await addDoc(productsRef, data);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add product:", error);
    throw error;
  }
}

/**
 * Get a product by ID.
 * ⚡ Network-resilient: 3 attempts × 15s timeout with exponential backoff.
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const snap = await withRetry(
      () => getDoc(doc(db, "products", id)),
      { shouldRetry: shouldRetryRead }
    );
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Product;
  } catch (error) {
    console.error("Failed to fetch product (after retries):", error);
    return null;
  }
}

/**
 * Get all products (newest first).
 * ⚡ Network-resilient: 3 attempts × 15s timeout.
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const q = query(productsRef, orderBy("createdAt", "desc"));
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  } catch (error) {
    console.error("Failed to fetch products (after retries):", error);
    return [];
  }
}

/**
 * Get products owned by a specific seller (newest first).
 * ⚡ Network-resilient: 3 attempts × 15s timeout.
 */
export async function getProductsByOwner(ownerId: string): Promise<Product[]> {
  try {
    const q = query(
      productsRef,
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "desc")
    );
    const snap = await withRetry(
      () => getDocs(q),
      { shouldRetry: shouldRetryRead }
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  } catch (error) {
    console.error("Failed to fetch owner products (after retries):", error);
    return [];
  }
}

/**
 * Update a product.
 * ⚠️ Not retried — writes must not run twice.
 */
export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<void> {
  try {
    await updateDoc(doc(db, "products", id), data);
  } catch (error) {
    console.error("Failed to update product:", error);
    throw error;
  }
}

/**
 * Delete a product.
 * ⚠️ Not retried — writes must not run twice.
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (error) {
    console.error("Failed to delete product:", error);
    throw error;
  }
}