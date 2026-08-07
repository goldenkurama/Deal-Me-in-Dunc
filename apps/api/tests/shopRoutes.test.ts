import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicUser } from "@fox-blackjack/shared-types";
import { createApp } from "../src/app.js";
import type { AuthService } from "../src/services/authService.js";
import type { GameService } from "../src/services/gameService.js";
import {
  ShopError,
  type ShopService
} from "../src/services/shopServiceContract.js";

const user: PublicUser = {
  id: "7",
  username: "duncan_fan",
  chips: 100,
  dunkaroos: 20
};
const gameService: GameService = { settleHand: vi.fn() };
const servers: Server[] = [];

function fakeAuthService(authenticatedUser: PublicUser | null): AuthService {
  return {
    register: vi.fn(),
    login: vi.fn(),
    authenticate: vi.fn(async () => authenticatedUser),
    logout: vi.fn()
  };
}

async function startApi(
  authService: AuthService,
  shopService: ShopService
): Promise<string> {
  const server = createApp(authService, gameService, shopService).listen(
    0,
    "127.0.0.1"
  );
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

describe("shop routes", () => {
  it("lists the server-authoritative catalog", async () => {
    const shopService: ShopService = {
      listItems: () => ({
        items: [
          {
            key: "chips_10",
            name: "10 CHIPS",
            description: "Trade 10 dunkaroos for 10 chips.",
            priceDunkaroos: 10
          }
        ]
      }),
      purchaseItem: vi.fn()
    };
    const baseUrl = await startApi(fakeAuthService(user), shopService);

    const response = await fetch(`${baseUrl}/api/shop/items`, {
      headers: { cookie: "deal_me_in_session=current-token" }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(shopService.listItems());
  });

  it("purchases an item for an authenticated player", async () => {
    const shopService: ShopService = {
      listItems: () => ({ items: [] }),
      purchaseItem: vi.fn(async () => ({
        itemKey: "chips_10",
        balances: { chips: 110, dunkaroos: 10 }
      }))
    };
    const baseUrl = await startApi(fakeAuthService(user), shopService);

    const response = await fetch(`${baseUrl}/api/shop/purchase`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "deal_me_in_session=current-token"
      },
      body: JSON.stringify({ itemKey: "chips_10" })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      itemKey: "chips_10",
      balances: { chips: 110, dunkaroos: 10 }
    });
    expect(shopService.purchaseItem).toHaveBeenCalledWith("7", "chips_10");
  });

  it("requires authentication and rejects malformed item keys", async () => {
    const shopService: ShopService = {
      listItems: () => ({ items: [] }),
      purchaseItem: vi.fn(async () => {
        throw new ShopError(500, "unexpected", "Unexpected call");
      })
    };
    const unauthenticatedUrl = await startApi(
      fakeAuthService(null),
      shopService
    );
    const unauthorized = await fetch(`${unauthenticatedUrl}/api/shop/items`);
    expect(unauthorized.status).toBe(401);

    const authenticatedUrl = await startApi(
      fakeAuthService(user),
      shopService
    );
    const malformed = await fetch(`${authenticatedUrl}/api/shop/purchase`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "deal_me_in_session=current-token"
      },
      body: JSON.stringify({ itemKey: "../bad" })
    });
    expect(malformed.status).toBe(400);
    expect(shopService.purchaseItem).not.toHaveBeenCalled();
  });
});
