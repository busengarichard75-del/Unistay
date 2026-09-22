// src/lib/firebase-admin.ts
//
// ⚠️ CRITICAL: This file must have ZERO module-scope side effects.
// Any initialization that runs at import time can crash every page
// that (transitively) imports this file. All getters are lazy.

import { getApps, getApp, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
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
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }
  return getApp();
}

/**
 * Lazy Firestore getter — call INSIDE a function, never at module scope.
 */
export function getFirestoreDb() {
  const app = getAdminApp();
  return getFirestore(app);
}

/**
 * Lazy Auth getter — call INSIDE a function, never at module scope.
 * Used to verify client ID tokens on server routes.
 */
export function getAuthAdmin() {
  const app = getAdminApp();
  return getAuth(app);
}

// ⚠️ DO NOT add `export const db = getFirestoreDb();` here.
// That would execute at import time and crash every page that imports this
// module if the Admin SDK fails to initialize for any reason.