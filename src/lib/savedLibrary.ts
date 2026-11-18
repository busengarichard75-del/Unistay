// src/lib/savedLibrary.ts
const KEY = "pezazm_saved_library";
const EMPTY = new Set<string>();
let cache: Set<string> | null = null;
const listeners = new Set<() => void>();

function read(): Set<string> {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    cache = new Set(ids);
  } catch {
    cache = new Set();
  }
  return cache;
}

function emit() {
  listeners.forEach((l) => l());
}

/** Stable snapshot — same reference until the saved set changes. */
export function getSavedSnapshot(): Set<string> {
  return read();
}

export const getEmptySnapshot = () => EMPTY;

export function toggleSaved(id: string): boolean {
  const current = read();
  const next = new Set(current);
  const nowSaved = !next.has(id);
  if (nowSaved) next.add(id);
  else next.delete(id);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify([...next]));
  } catch {
    // quota exceeded / private mode — ignore
  }
  emit();
  return nowSaved;
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Cross-tab sync
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      emit();
    }
  });
}