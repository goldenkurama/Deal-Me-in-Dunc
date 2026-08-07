import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicUser } from "@fox-blackjack/shared-types";
import { createApp } from "../src/app.js";
import { AuthError, type AuthService } from "../src/services/authService.js";
import type { GameService } from "../src/services/gameService.js";
import type { ShopService } from "../src/services/shopServiceContract.js";

const user: PublicUser = {
  id: "7",
  username: "duncan_fan",
  chips: 100,
  dunkaroos: 0
};

function fakeAuthService(overrides: Partial<AuthService> = {}): AuthService {
  return {
    register: vi.fn(async () => ({ user, token: "register-token" })),
    login: vi.fn(async () => ({ user, token: "login-token" })),
    authenticate: vi.fn(async () => user),
    logout: vi.fn(async () => undefined),
    ...overrides
  };
}

const gameService: GameService = {
  settleHand: vi.fn(async () => ({ balances: { chips: 100, dunkaroos: 0 } }))
};
const shopService: ShopService = {
  listItems: () => ({ items: [] }),
  purchaseItem: vi.fn()
};

const servers: Server[] = [];

async function startApi(authService: AuthService): Promise<string> {
  const server = createApp(authService, gameService, shopService).listen(
    0,
    "127.0.0.1"
  );
  servers.push(server);

  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
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

describe("authentication routes", () => {
  it("registers a user and sets an HTTP-only session cookie", async () => {
    const authService = fakeAuthService();
    const baseUrl = await startApi(authService);

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "duncan_fan", password: "cards123" })
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ user });
    expect(response.headers.get("set-cookie")).toContain(
      "deal_me_in_session=register-token"
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(authService.register).toHaveBeenCalledWith("duncan_fan", "cards123");
  });

  it("rejects malformed credentials before calling the service", async () => {
    const authService = fakeAuthService();
    const baseUrl = await startApi(authService);

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "duncan_fan" })
    });

    expect(response.status).toBe(400);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("returns a safe login error", async () => {
    const authService = fakeAuthService({
      login: vi.fn(async () => {
        throw new AuthError(401, "invalid_login", "Incorrect username or password");
      })
    });
    const baseUrl = await startApi(authService);

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "duncan_fan", password: "wrong-pass" })
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "invalid_login",
      message: "Incorrect username or password"
    });
  });

  it("reads the session cookie for the current user", async () => {
    const authService = fakeAuthService();
    const baseUrl = await startApi(authService);

    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie: "other=value; deal_me_in_session=current-token" }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user });
    expect(authService.authenticate).toHaveBeenCalledWith("current-token");
  });

  it("deletes the server session and expires the cookie on logout", async () => {
    const authService = fakeAuthService();
    const baseUrl = await startApi(authService);

    const response = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { cookie: "deal_me_in_session=logout-token" }
    });

    expect(response.status).toBe(204);
    expect(authService.logout).toHaveBeenCalledWith("logout-token");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
