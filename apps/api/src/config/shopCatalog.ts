import type { ShopCategory } from "@fox-blackjack/shared-types";

export interface ShopItem {
  key: string;
  name: string;
  description: string;
  category: ShopCategory;
  priceDunkaroos: number;
  assetKey: string;
  previewAssetKey?: string;
}

/**
 * Add permanent shop definitions here.
 *
 * Do not accept price or category from a browser purchase request. The API
 * receives only an item key and looks up the authoritative definition here.
 * Once released, an item's key should be treated as permanent because owned
 * and equipped records refer to it.
 */
export const SHOP_ITEMS: readonly ShopItem[] = [
  // Example shape only; replace with real items when their art and prices exist.
  // {
  //   key: "card_back_example",
  //   name: "Example Card Back",
  //   description: "Replace this example with real content.",
  //   category: "card_back",
  //   priceDunkaroos: 250,
  //   assetKey: "card-backs/example"
  // }
];

export function getShopItem(itemKey: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.key === itemKey);
}
