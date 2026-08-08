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

import { databaseGameService } from "../src/services/databaseGameService.js";

const settlement = {
  handId: "8b55c446-a140-4bd8-9a3a-b6dcb039b1de",
  wager: 10,
  chipsStaked: 10,
  chipsAwarded: 25,
  dunkaroosAwarded: 15,
  outcome: "player-blackjack" as const
};

describe("database game settlement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.getConnection.mockResolvedValue(database);
  });

  it("updates both balances and records the wager and rewards atomically", async () => {
    database.execute
      .mockResolvedValueOnce([[{ chips: 100, dunkaroos: 5 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValue([{}]);

    await expect(databaseGameService.settleHand("7", settlement)).resolves.toEqual({
      balances: { chips: 115, dunkaroos: 20 }
    });

    expect(database.beginTransaction).toHaveBeenCalledOnce();
    expect(database.execute).toHaveBeenCalledWith(
      "UPDATE users SET chips = ?, dunkaroos = ? WHERE id = ?",
      [115, 20, "7"]
    );
    expect(database.commit).toHaveBeenCalledOnce();
    expect(database.rollback).not.toHaveBeenCalled();
    expect(database.release).toHaveBeenCalledOnce();
  });

  it("returns current balances without paying a retried hand twice", async () => {
    database.execute
      .mockResolvedValueOnce([[{ chips: 115, dunkaroos: 20 }]])
      .mockResolvedValueOnce([[{ id: 42 }]]);

    await expect(databaseGameService.settleHand("7", settlement)).resolves.toEqual({
      balances: { chips: 115, dunkaroos: 20 }
    });

    expect(database.execute).toHaveBeenCalledTimes(2);
    expect(database.commit).toHaveBeenCalledOnce();
  });

  it("rejects wagers below the table minimum", async () => {
    await expect(
      databaseGameService.settleHand("7", { ...settlement, wager: 5 })
    ).rejects.toMatchObject({ status: 400, code: "invalid_wager" });

    expect(database.getConnection).not.toHaveBeenCalled();
  });

  it("supports a free All Bets Are Off hand", async () => {
    database.execute
      .mockResolvedValueOnce([[{ chips: 100, dunkaroos: 5 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValue([{}]);

    await expect(databaseGameService.settleHand("7", {
      ...settlement,
      outcome: "player-win",
      chipsStaked: 0,
      chipsAwarded: 10,
      dunkaroosAwarded: 10
    })).resolves.toEqual({ balances: { chips: 110, dunkaroos: 15 } });
  });

  it("rejects rewards that do not match positive chip profit", async () => {
    await expect(databaseGameService.settleHand("7", {
      ...settlement,
      dunkaroosAwarded: 999
    })).rejects.toMatchObject({ status: 400, code: "invalid_rewards" });
    expect(database.getConnection).not.toHaveBeenCalled();
  });
});
