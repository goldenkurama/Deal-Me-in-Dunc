import type {
  ShopCatalogResponse,
  ShopPurchaseResponse
} from "@fox-blackjack/shared-types";
import { apiRequest } from "./authApi";

export function getShopCatalog(): Promise<ShopCatalogResponse> {
  return apiRequest<ShopCatalogResponse>("/api/shop/items");
}

export function purchaseShopItem(
  itemKey: string
): Promise<ShopPurchaseResponse> {
  return apiRequest<ShopPurchaseResponse>("/api/shop/purchase", {
    method: "POST",
    body: JSON.stringify({ itemKey })
  });
}
