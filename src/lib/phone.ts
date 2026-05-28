import { z } from "zod";

// Nigerian mobile = +234 followed by 10 digits, where the 10-digit local
// portion starts with 7, 8, or 9 (mobile prefixes 070x/080x/081x/090x/091x).
// Landlines are out of scope for customer notifications.
export const NIGERIAN_MOBILE_REGEX = /^\+234[789]\d{9}$/;

const PHONE_ERROR =
  "Enter a valid Nigerian mobile (e.g. 08012345678 or +2348012345678)";

/**
 * Canonicalize whatever the user typed into +234XXXXXXXXXX form. Accepts
 * common Nigerian input shapes (with/without leading 0, with/without +234,
 * spaces, dashes, parens). Returns the cleaned string; the caller validates
 * the result with NIGERIAN_MOBILE_REGEX.
 */
export function normalizeNigerianPhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("+234")) return cleaned;
  if (cleaned.startsWith("234")) return `+${cleaned}`;
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return `+234${cleaned.slice(1)}`;
  }
  if (cleaned.length === 10 && /^[789]/.test(cleaned)) {
    return `+234${cleaned}`;
  }
  return cleaned;
}

/** Required Nigerian mobile — parses to canonical +234… form. */
export const nigerianPhoneSchema = z
  .string()
  .min(1, "Phone is required")
  .transform((v) => normalizeNigerianPhone(v.trim()))
  .pipe(z.string().regex(NIGERIAN_MOBILE_REGEX, PHONE_ERROR));

/** Optional Nigerian mobile — empty allowed, otherwise must be valid. */
export const optionalNigerianPhoneSchema = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? normalizeNigerianPhone(v.trim()) : ""))
  .pipe(
    z
      .string()
      .refine((v) => v === "" || NIGERIAN_MOBILE_REGEX.test(v), PHONE_ERROR)
  );

export function isValidNigerianMobile(phone: string): boolean {
  return NIGERIAN_MOBILE_REGEX.test(phone);
}
