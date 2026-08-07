import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicUser } from "@fox-blackjack/shared-types";
import { createApp } from "../src/app.js";
import type { AuthService } from "../src/services/authService.js";
import type { GameService } from "../src/services/gameService.js";
import type { ShopService } from "../src/services/shopServiceContract.js";

const user: PublicUser = {
  id: "7",
  username: "duncan_fan",
  chips: 100,
  dunkaroos: 0
};

function fakeAuthService(authenticatedUser: PublicUser | null): AuthService {
  return {
    register: vi.fn(),
    login: vi.fn(),
    authenticate: vi.fn(async () => authenticatedUser),
    logout: vi.fn()
  };
}

const servers: Server[] = [];
const shopService: ShopService = {
  listItems: () => ({ items: [] }),
  purchaseItem: vi.fn()
};

async function startApi(
  authService: AuthService,
  gameService: GameService
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

describe("game routes", () => {
  it("saves an authenticated hand settlement", async () => {
    const gameService: GameService = {
      settleHand: vi.fn(async () => ({
        balances: { chips: 115, dunkaroos: 15 }
      }))
    };
    const baseUrl = await startApi(fakeAuthService(user), gameService);
    const settlement = {
      handId: "8b55c446-a140-4bd8-9a3a-b6dcb039b1de",
      wager: 10,
      outcome: "player-blackjack" as const
    };

    const response = await fetch(`${baseUrl}/api/game/settle`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "deal_me_in_session=current-token"
      },
      body: JSON.stringify(settlement)
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      balances: { chips: 115, dunkaroos: 15 }
    });
    expect(gameService.settleHand).toHaveBeenCalledWith("7", settlement);
  });

  it("requires a valid session", async () => {
    const gameService: GameService = { settleHand: vi.fn() };
    const baseUrl = await startApi(fakeAuthService(null), gameService);

    const response = await fetch(`${baseUrl}/api/game/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        handId: "8b55c446-a140-4bd8-9a3a-b6dcb039b1de",
        wager: 10,
        outcome: "player-win"
      })
    });

    expect(response.status).toBe(401);
    expect(gameService.settleHand).not.toHaveBeenCalled();
  });

  it("rejects malformed settlements", async () => {
    const gameService: GameService = { settleHand: vi.fn() };
    const baseUrl = await startApi(fakeAuthService(user), gameService);

    const response = await fetch(`${baseUrl}/api/game/settle`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "deal_me_in_session=current-token"
      },
      body: JSON.stringify({ handId: "not-a-uuid", wager: -10, outcome: "win" })
    });

    expect(response.status).toBe(400);
    expect(gameService.settleHand).not.toHaveBeenCalled();
  });
});
