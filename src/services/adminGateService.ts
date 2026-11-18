// src/services/adminGateService.ts
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const GATE_REF = () => doc(db, "adminConfig", "gate");
const LEGACY_PIN = "3542";

export interface AdminGate {
  passwordHash: string;
  salt: string;
  updatedAt: number;
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAdminPassword(input: string): Promise<boolean> {
  const snap = await getDoc(GATE_REF());
  if (!snap.exists()) return input === LEGACY_PIN;
  const { passwordHash, salt } = snap.data() as AdminGate;
  return (await hashPassword(input, salt)) === passwordHash;
}

export async function hasRealPassword(): Promise<boolean> {
  return (await getDoc(GATE_REF())).exists();
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const salt = generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  await setDoc(GATE_REF(), { passwordHash, salt, updatedAt: Date.now() });
}