import { describe, expect, it } from "vitest";
import {
  BASE_ARCADE_SCORING_RULES,
  calculateArcadeHandValue,
  calculateArcadePayout,
  calculateProfitMultiplier,
  chooseHouseRule,
  compareCardValues,
  createSeededRandom,
  offerTrinkets,
  lowestCardIndex,
  resolveRubberBandBust,
  resolveArcadeOutcome
} from "../src/index.js";
import type { Card, TrinketSlots } from "../src/index.js";

const card = (rank: Card["rank"], suit: Card["suit"] = "clubs"): Card => ({ rank, suit });

describe("arcade catalogs and rotation", () => {
  it("offers two unique Trinkets that are not already active", () => {
    const slots: TrinketSlots = [
      { id: "record" },
      { id: "dice" },
      { id: "hall-pass" }
    ];
    const offered = offerTrinkets(slots, createSeededRandom(12));
    expect(new Set(offered.map(({ id }) => id)).size).toBe(2);
    expect(offered.map(({ id }) => id)).not.toContain("record");
    expect(offered.map(({ id }) => id)).not.toContain("dice");
    expect(offered.map(({ id }) => id)).not.toContain("hall-pass");
  });

  it("does not immediately repeat an expired House Rule", () => {
    expect(chooseHouseRule("cheap-trick", createSeededRandom(2)).id).not.toBe("cheap-trick");
  });
});

describe("arcade scoring", () => {
  it("uses 17 as the target and Blackjack value for Issue 17", () => {
    const rules = { ...BASE_ARCADE_SCORING_RULES, target: 17 };
    const seventeen = calculateArcadeHandValue([card("10"), card("7")], rules);
    expect(seventeen).toMatchObject({ total: 17, busted: false });
    expect(calculateArcadeHandValue([card("10"), card("8")], rules).busted).toBe(true);
  });

  it("supports Broken Calculator and Two-Card Monte face values", () => {
    const value = calculateArcadeHandValue(
      [card("3"), card("8"), card("K")],
      { target: 21, faceCardValue: 13, brokenCalculator: true }
    );
    expect(value.total).toBe(22);
  });

  it("compares cards and finds the lowest card for interactive effects", () => {
    expect(compareCardValues(card("6"), card("9"))).toBe("higher");
    expect(compareCardValues(card("K"), card("Q"))).toBe("equal");
    expect(lowestCardIndex([card("9"), card("2"), card("5")])).toBe(1);
  });

  it("flings the busting card into the dealer hand for Rubber Band", () => {
    const result = resolveRubberBandBust(
      [card("10"), card("8"), card("6", "hearts")],
      [card("10"), card("7")]
    );

    expect(result.playerHand).toEqual([card("10"), card("8")]);
    expect(result.dealerHand).toEqual([card("10"), card("7"), card("6", "hearts")]);
    expect(result.flungCard).toEqual(card("6", "hearts"));
    expect(result.outcome).toBe("push");
  });

  it("lets the lower non-busted Golf total win", () => {
    expect(resolveArcadeOutcome({
      playerValue: { total: 16, soft: false, busted: false },
      dealerValue: { total: 20, soft: false, busted: false },
      playerBlackjack: false,
      dealerBlackjack: false,
      golfScoring: true
    })).toBe("player-win");
  });
});

describe("arcade payouts", () => {
  it("stacks additive and multiplicative Trinket bonuses", () => {
    expect(calculateProfitMultiplier({
      punchCardHits: 2,
      followedMagic8Ball: true,
      correctTradingPredictions: 1,
      sunglasses: true,
      recordBonus: true,
      piggyBankSmash: true,
      bandAidUsed: true
    })).toBe(21);
  });
  it("stacks bonuses and rounds once after Blackjack base profit", () => {
    expect(calculateArcadePayout({
      outcome: "player-blackjack",
      wager: 5,
      chipsStaked: 5,
      positiveProfitMultiplier: 1.5
    })).toEqual({
      outcome: "player-blackjack",
      wager: 5,
      chipsStaked: 5,
      chipsAwarded: 17,
      chipProfit: 12,
      dunkaroosAwarded: 12
    });
  });

  it("awards and preserves five-ending profits from 1.5x multipliers", () => {
    expect(calculateArcadePayout({
      outcome: "player-win",
      wager: 10,
      chipsStaked: 10,
      positiveProfitMultiplier: 1.5
    })).toEqual({
      outcome: "player-win",
      wager: 10,
      chipsStaked: 10,
      chipsAwarded: 25,
      chipProfit: 15,
      dunkaroosAwarded: 15
    });
  });

  it("supports Piggy Bank Save refunds", () => {
    expect(calculateArcadePayout({
      outcome: "dealer-win",
      wager: 20,
      chipsStaked: 20,
      positiveProfitMultiplier: 1,
      lossRefundFraction: 0.5
    }).chipsAwarded).toBe(10);
  });

  it("supports free House Rule hands", () => {
    expect(calculateArcadePayout({
      outcome: "player-win",
      wager: 10,
      chipsStaked: 0,
      positiveProfitMultiplier: 1
    })).toMatchObject({ chipsAwarded: 10, chipProfit: 10, dunkaroosAwarded: 10 });
  });
});
