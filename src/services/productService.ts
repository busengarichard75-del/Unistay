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

const productsRef = collection(db, "products");

export async function addProduct(data: Omit<Product, "id">): Promise<string> {
  try {
    const docRef = await addDoc(productsRef, data);
    return docRef.id;
  } catch (error) {
    console.error("Failed to add product:", error);
    throw error;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Product;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const q = query(productsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function getProductsByOwner(ownerId: string): Promise<Product[]> {
  try {
    const q = query(
      productsRef,
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  } catch (error) {
    console.error("Failed to fetch owner products:", error);
    return [];
  }
}

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

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (error) {
    console.error("Failed to delete product:", error);
    throw error;
  }
}