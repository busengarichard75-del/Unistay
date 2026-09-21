// src/lib/stripUndefined.ts

/**
 * Recursively remove any `undefined` values from an object.
 *
 * Firestore rejects writes containing `undefined` values — it only accepts
 * `null` (explicit empty), actual values, or the field being absent.
 *
 * This helper makes any payload Firestore-safe. Handles:
 *  - nested objects (e.g., availability: { note: undefined })
 *  - arrays of primitives
 *  - arrays of objects
 *
 * Use it as the last step before any Firestore write:
 *   await addDoc(ref, stripUndefined(payload));
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      item !== null && typeof item === "object"
        ? stripUndefined(item as Record<string, any>)
        : item
    ) as unknown as T;
  }

  const out: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined entirely — the field won't exist on the doc
    if (value === undefined) continue;

    // Recurse into nested plain objects (but keep null as-is)
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      out[key] = stripUndefined(value);
    } else if (Array.isArray(value)) {
      out[key] = value.map((item) =>
        item !== null && typeof item === "object"
          ? stripUndefined(item as Record<string, any>)
          : item
      );
    } else {
      out[key] = value;
    }
  }

  return out as T;
}