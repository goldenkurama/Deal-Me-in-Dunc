import type { CosmeticLoadout } from "@fox-blackjack/shared-types";

// These are built-in client assets, not shop entries and not ownership rows.
export const DEFAULT_COSMETICS: Readonly<CosmeticLoadout> = {
  card_back: null,
  table: null,
  music: null,
  win_sound: null,
  bust_sound: null,
  decoration: null
};
