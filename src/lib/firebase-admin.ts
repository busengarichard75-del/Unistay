// src/lib/firebase-admin.ts
import { getApps, getApp, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function getFirestoreDb() {
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

  let app;
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    app = getApp();
  }

  return getFirestore(app);
}

// Export db as a function that lazily loads Firestore
export const db = getFirestoreDb();