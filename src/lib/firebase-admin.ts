// src/lib/firebase-admin.ts
import { getApps, getApp, initializeApp, cert } from "firebase-admin/app";
import type { App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import type { Auth } from "firebase-admin/auth";

function getAdminApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Firebase Admin environment variables are missing:\n` +
      `FIREBASE_PROJECT_ID: ${projectId ? "✅" : "❌"}\n` +
      `FIREBASE_CLIENT_EMAIL: ${clientEmail ? "✅" : "❌"}\n` +
      `FIREBASE_PRIVATE_KEY: ${privateKey ? "✅" : "❌"}\n\n` +
      `Please add these variables to your .env.local file.`
    );
  }

  if (getApps().length === 0) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }
  return getApp();
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAuthAdmin(): Auth {
  return getAuth(getAdminApp());
}

export function getDb(): Firestore {
  return getFirestoreDb();
}

export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    const instance = getFirestoreDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});