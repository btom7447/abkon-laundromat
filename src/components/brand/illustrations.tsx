/**
 * Clothing & laundry illustrations powered by Iconify.
 *
 * Primary pack: **Game Icons** (`game-icons:`) — covers the garment range
 * (trousers, kimono, robe, dress, polo, hoodie, etc.) better than any other
 * free pack.
 *
 * For a few items Game Icons doesn't have a clean match for (curtain, rug,
 * business suit, generic outfit, fabric), we fall back to **MDI** and
 * **Material Symbols** — both pair visually with Game Icons since all three
 * are solid-fill currentColor icons.
 *
 * Iconify fetches data on demand from its CDN and caches in localStorage.
 */

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export type IllustrationName =
  | "shirt"
  | "tshirt"
  | "blouse"
  | "trouser"
  | "jeans"
  | "shorts"
  | "skirt"
  | "agbada"
  | "senator"
  | "wrapper"
  | "ankara-updown"
  | "gown"
  | "suit"
  | "underwear"
  | "kiddies"
  | "duvet"
  | "bedspread"
  | "cardigan"
  | "curtain"
  | "towel"
  | "facecap"
  | "rug"
  | "footmat"
  | "shoes"
  | "bag"
  | "sofa"
  | "pillow"
  | "teddy"
  | "negotiable"
  | "hanger"
  | "washing-machine";

const ICON_MAP: Record<IllustrationName, string> = {
  // ── Tops ─────────────────────────────────────────────
  shirt: "game-icons:polo-shirt",
  tshirt: "game-icons:t-shirt",
  blouse: "game-icons:corset",
  cardigan: "game-icons:hoodie",
  underwear: "game-icons:underwear",
  kiddies: "game-icons:baby-face",
  facecap: "game-icons:billed-cap",

  // ── Bottoms ──────────────────────────────────────────
  trouser: "game-icons:trousers",
  jeans: "game-icons:armored-pants",
  shorts: "game-icons:underwear-shorts",
  skirt: "game-icons:skirt",

  // ── Native / Formal ──────────────────────────────────
  agbada: "game-icons:robe",
  senator: "mdi:human-male", // full male figure outfit (top + bottom)
  wrapper: "mdi:texture", // fabric texture
  "ankara-updown": "mdi:human-handsdown", // top + trouser outfit on a figure
  gown: "game-icons:dress",
  suit: "mdi:account-tie", // person with business suit + tie

  // ── Household ────────────────────────────────────────
  duvet: "game-icons:blanket", // same family as bedspread
  bedspread: "game-icons:blanket",
  curtain: "mdi:curtains", // actual curtain icon
  towel: "game-icons:towel",
  rug: "mdi:rug",
  footmat: "mdi:texture-box",

  // ── Negotiable / misc ────────────────────────────────
  pillow: "game-icons:pillow",
  teddy: "mdi:teddy-bear", // game-icons has no teddy; mdi is already mixed in for human/texture icons
  shoes: "game-icons:running-shoe",
  bag: "game-icons:hand-bag", // game-icons name is hyphenated (not "handbag")
  sofa: "game-icons:armchair",
  negotiable: "game-icons:price-tag",
  hanger: "game-icons:hanger",
  "washing-machine": "game-icons:washing-machine",
};

interface IllustrationProps {
  name: IllustrationName;
  size?: number;
  className?: string;
}

export function Illustration({ name, size = 64, className }: IllustrationProps) {
  const iconId = ICON_MAP[name] ?? ICON_MAP.hanger;
  return (
    <Icon
      icon={iconId}
      width={size}
      height={size}
      className={cn(className)}
      aria-hidden="true"
    />
  );
}
