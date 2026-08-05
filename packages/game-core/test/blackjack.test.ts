import { describe, expect, it } from "vitest";
import {
  calculateHandValue,
  createDeck,
  dealerShouldHit,
  isNaturalBlackjack,
  resolveHand
} from "../src/index.js";
import type { Card, Rank, Suit } from "../src/index.js";

function card(rank: Rank, suit: Suit = "clubs"): Card {
  return { rank, suit };
}

describe("deck", () => {
  it("creates 52 unique cards", () => {
    const deck = createDeck();
    const keys = new Set(deck.map(({ rank, suit }) => `${rank}-${suit}`));

    expect(deck).toHaveLength(52);
    expect(keys.size).toBe(52);
  });
});

describe("hand values", () => {
  it("reduces an ace from 11 to 1 when needed", () => {
    expect(calculateHandValue([card("A"), card("9"), card("5")])).toEqual({
      total: 15,
      soft: false,
      busted: false
    });
  });

  it("recognizes a natural blackjack", () => {
    expect(isNaturalBlackjack([card("A"), card("K")])).toBe(true);
    expect(isNaturalBlackjack([card("7"), card("7"), card("7")])).toBe(false);
  });

  it("stands on soft 17", () => {
    expect(dealerShouldHit([card("A"), card("6")])).toBe(false);
  });
});

describe("hand resolution", () => {
  it("pays an ordinary win 1:1", () => {
    expect(
      resolveHand([card("10"), card("9")], [card("10"), card("8")], 10)
    ).toEqual({
      outcome: "player-win",
      wager: 10,
      chipsReturned: 20,
      chipProfit: 10,
      dunkaroosAwarded: 10
    });
  });

  it("pays blackjack 3:2 and rounds profit upward", () => {
    expect(resolveHand([card("A"), card("K")], [card("10"), card("9")], 5))
      .toEqual({
        outcome: "player-blackjack",
        wager: 5,
        chipsReturned: 13,
        chipProfit: 8,
        dunkaroosAwarded: 8
      });
  });

  it("treats a natural blackjack as stronger than a three-card 21", () => {
    expect(
      resolveHand(
        [card("A"), card("K")],
        [card("7"), card("7"), card("7")],
        10
      ).outcome
    ).toBe("player-blackjack");
  });

  it("returns the wager on a push", () => {
    expect(
      resolveHand([card("10"), card("8")], [card("9"), card("9")], 10)
    ).toMatchObject({
      outcome: "push",
      chipsReturned: 10,
      chipProfit: 0,
      dunkaroosAwarded: 0
    });
  });
});
