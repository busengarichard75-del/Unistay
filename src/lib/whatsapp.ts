// src/lib/whatsapp.ts

/**
 * Normalize any Zambian phone number into the international format
 * required by wa.me links: 260771319817
 *
 * Accepts: 0771319817 · +260771319817 · 260771319817 · 260 77 1319817
 * Returns: "260771319817" or null if invalid.
 */
export function normalizeZambianPhone(
  raw: string | undefined | null
): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("260") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length >= 9) return "260" + digits.slice(1);
  if (digits.length === 9) return "260" + digits;
  return digits.length >= 10 ? digits : null;
}

/**
 * Build a wa.me deep link with a pre-filled message.
 * Returns null if the phone number is invalid.
 */
export function buildWhatsAppLink(
  rawPhone: string | undefined | null,
  message: string
): string | null {
  const number = normalizeZambianPhone(rawPhone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}