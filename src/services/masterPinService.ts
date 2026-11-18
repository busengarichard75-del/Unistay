// src/services/masterPinService.ts
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MASTER_REF = () => doc(db, "adminConfig", "masterPin");

export interface MasterPinDoc {
  pinHash: string;
  salt: string;
  updatedAt: number;
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hasMasterPin(): Promise<boolean> {
  return (await getDoc(MASTER_REF())).exists();
}

export async function verifyMasterPin(pin: string): Promise<boolean> {
  const snap = await getDoc(MASTER_REF());
  if (!snap.exists()) return false;
  const { pinHash, salt } = snap.data() as MasterPinDoc;
  return (await hashPin(pin, salt)) === pinHash;
}

export async function setMasterPin(pin: string): Promise<void> {
  if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    throw new Error("Master PIN must be exactly 6 digits.");
  }
  const salt = generateSalt();
  const pinHash = await hashPin(pin, salt);
  await setDoc(MASTER_REF(), { pinHash, salt, updatedAt: Date.now() });
}