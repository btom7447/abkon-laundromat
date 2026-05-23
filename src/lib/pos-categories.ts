/**
 * POS category + illustration mapping. Pure name-based lookup until the schema
 * gets a `category` field on ItemType.
 */
import type { IllustrationName } from "@/components/brand/illustrations";

export type PosCategoryId = "all" | "tops" | "bottoms" | "native" | "formal" | "household" | "negotiable" | "other";

export const POS_CATEGORIES: Array<{ id: PosCategoryId; label: string }> = [
  { id: "all", label: "All items" },
  { id: "tops", label: "Tops" },
  { id: "bottoms", label: "Bottoms" },
  { id: "native", label: "Native wear" },
  { id: "formal", label: "Formal" },
  { id: "household", label: "Household" },
  { id: "negotiable", label: "Negotiable" },
  { id: "other", label: "Other" },
];

const CATEGORY_BY_NAME: Record<string, PosCategoryId> = {
  Shirt: "tops",
  "T-shirt": "tops",
  Blouse: "tops",
  Cardigan: "tops",
  Underwear: "tops",
  "Kiddies wear": "tops",
  "Face cap": "tops",
  "Plain trouser": "bottoms",
  Jeans: "bottoms",
  Skirt: "bottoms",
  Shorts: "bottoms",
  "Pleated skirt": "bottoms",
  Wrapper: "native",
  "Ankara up/down": "native",
  "Complete agbada": "native",
  "Senator wear": "native",
  "Complete suit": "formal",
  Gown: "formal",
  Duvet: "household",
  Bedspread: "household",
  Curtain: "household",
  Towel: "household",
  "Foot mat": "household",
  Rug: "household",
  Pillow: "negotiable",
  Teddy: "negotiable",
  Shoes: "negotiable",
  Bags: "negotiable",
  Sofa: "negotiable",
};

const ILLUSTRATION_BY_NAME: Record<string, IllustrationName> = {
  Shirt: "shirt",
  "T-shirt": "tshirt",
  "Plain trouser": "trouser",
  Jeans: "jeans",
  Skirt: "skirt",
  Blouse: "blouse",
  Shorts: "shorts",
  "Ankara up/down": "ankara-updown",
  "Complete agbada": "agbada",
  "Senator wear": "senator",
  Underwear: "underwear",
  "Complete suit": "suit",
  Gown: "gown",
  "Kiddies wear": "kiddies",
  Duvet: "duvet",
  Bedspread: "bedspread",
  Cardigan: "cardigan",
  Curtain: "curtain",
  Towel: "towel",
  "Face cap": "facecap",
  Wrapper: "wrapper",
  "Pleated skirt": "skirt",
  Rug: "rug",
  "Foot mat": "footmat",
  Pillow: "pillow",
  Teddy: "teddy",
  Shoes: "shoes",
  Bags: "bag",
  Sofa: "sofa",
};

/**
 * Resolve the catalog category for an item.
 *
 * Resolution order:
 *   1. Explicit `storedCategory` (the admin-set value on ItemType.category).
 *   2. NEGOTIABLE unit → always "negotiable".
 *   3. Name-based lookup against the built-in mapping.
 *   4. Fallback → "other".
 */
export function categoryForItem(
  name: string,
  unit: "PIECE" | "SQM" | "NEGOTIABLE",
  storedCategory?: string | null
): PosCategoryId {
  if (storedCategory) {
    // Trust the stored value if it parses as a known category id.
    const known = POS_CATEGORIES.find((c) => c.id === storedCategory);
    if (known) return known.id;
  }
  if (unit === "NEGOTIABLE") return "negotiable";
  return CATEGORY_BY_NAME[name] ?? "other";
}

export function illustrationForItem(name: string): IllustrationName {
  return ILLUSTRATION_BY_NAME[name] ?? "hanger";
}
