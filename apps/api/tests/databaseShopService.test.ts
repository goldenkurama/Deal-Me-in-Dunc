import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  beginTransaction: vi.fn(),
  execute: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
  getConnection: vi.fn()
}));

vi.mock("../src/database/pool.js", () => ({
  pool: { getConnection: database.getConnection }
}));

import { databaseShopService } from "../src/services/shopService.js";

describe("database shop purchases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.getConnection.mockResolvedValue(database);
  });

  it("atomically trades 10 dunkaroos for 10 chips", async () => {
    database.execute
      .mockResolvedValueOnce([[{ chips: 100, dunkaroos: 25 }]])
      .mockResolvedValue([{}]);

    await expect(
      databaseShopService.purchaseItem("7", "chips_10")
    ).resolves.toEqual({
      itemKey: "chips_10",
      balances: { chips: 110, dunkaroos: 15 }
    });

    expect(database.execute).toHaveBeenCalledWith(
      "UPDATE users SET chips = ?, dunkaroos = ? WHERE id = ?",
      [110, 15, "7"]
    );
    expect(database.execute).toHaveBeenCalledWith(
      expect.stringContaining("'dunkaroos'"),
      ["7", -10, "currency_exchange_out", 15, expect.any(String), "chips_10"]
    );
    expect(database.execute).toHaveBeenCalledWith(
      expect.stringContaining("'chips'"),
      ["7", 10, 110, expect.any(String), "chips_10"]
    );
    expect(database.commit).toHaveBeenCalledOnce();
    expect(database.rollback).not.toHaveBeenCalled();
    expect(database.release).toHaveBeenCalledOnce();
  });

  it("rolls back when the player cannot afford the exchange", async () => {
    database.execute.mockResolvedValueOnce([[{ chips: 100, dunkaroos: 5 }]]);

    await expect(
      databaseShopService.purchaseItem("7", "chips_10")
    ).rejects.toMatchObject({
      status: 409,
      code: "insufficient_dunkaroos"
    });

    expect(database.commit).not.toHaveBeenCalled();
    expect(database.rollback).toHaveBeenCalledOnce();
    expect(database.release).toHaveBeenCalledOnce();
  });
});
