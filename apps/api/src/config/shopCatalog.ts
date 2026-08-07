import type { ShopCategory } from "@fox-blackjack/shared-types";

interface ShopItemBase {
  key: string;
  name: string;
  description: string;
  priceDunkaroos: number;
}

export interface CosmeticShopItem extends ShopItemBase {
  kind: "cosmetic";
  category: ShopCategory;
  assetKey: string;
  previewAssetKey?: string;
}

export interface ChipBundleShopItem extends ShopItemBase {
  kind: "chip_bundle";
  chipsAwarded: number;
}

export type ShopItem = CosmeticShopItem | ChipBundleShopItem;

/**
 * Add permanent shop definitions here.
 *
 * Do not accept price or category from a browser purchase request. The API
 * receives only an item key and looks up the authoritative definition here.
 * Once released, an item's key should be treated as permanent because owned
 * and equipped records refer to it.
 */
export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    kind: "chip_bundle",
    key: "chips_10",
    name: "10 CHIPS",
    description: "Trade 10 dunkaroos for 10 chips.",
    priceDunkaroos: 10,
    chipsAwarded: 10
  }
];

export function getShopItem(itemKey: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.key === itemKey);
}
