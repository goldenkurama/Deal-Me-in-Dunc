import type {
  ShopCatalogResponse,
  ShopPurchaseResponse
} from "@fox-blackjack/shared-types";

export interface ShopService {
  listItems(): ShopCatalogResponse;
  purchaseItem(userId: string, itemKey: string): Promise<ShopPurchaseResponse>;
}

export class ShopError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ShopError";
  }
}
