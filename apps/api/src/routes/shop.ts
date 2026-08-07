import { Router, type Response } from "express";
import type { AuthService } from "../services/authService.js";
import {
  ShopError,
  type ShopService
} from "../services/shopServiceContract.js";
import { readSessionToken } from "./auth.js";

const ITEM_KEY_PATTERN = /^[a-z0-9_]{1,100}$/;

function readItemKey(body: unknown): string {
  if (
    typeof body !== "object" ||
    body === null ||
    !("itemKey" in body) ||
    typeof body.itemKey !== "string" ||
    !ITEM_KEY_PATTERN.test(body.itemKey)
  ) {
    throw new ShopError(400, "invalid_shop_purchase", "Invalid shop purchase");
  }
  return body.itemKey;
}

function sendError(response: Response, error: unknown): void {
  if (error instanceof ShopError) {
    response.status(error.status).json({ error: error.code, message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: "internal_error",
    message: "The server could not complete the request"
  });
}

export function createShopRouter(
  authService: AuthService,
  shopService: ShopService
): Router {
  const router = Router();

  router.use(async (request, response, next) => {
    try {
      const token = readSessionToken(request.headers.cookie);
      const user = token ? await authService.authenticate(token) : null;
      if (!user) {
        response.status(401).json({
          error: "not_authenticated",
          message: "Sign in to continue"
        });
        return;
      }
      response.locals.user = user;
      next();
    } catch (error) {
      sendError(response, error);
    }
  });

  router.get("/items", (_request, response) => {
    response.json(shopService.listItems());
  });

  router.post("/purchase", async (request, response) => {
    try {
      response.json(
        await shopService.purchaseItem(
          response.locals.user.id,
          readItemKey(request.body)
        )
      );
    } catch (error) {
      sendError(response, error);
    }
  });

  return router;
}
