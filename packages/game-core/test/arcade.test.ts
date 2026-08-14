import { describe, expect, it } from "vitest";
import {
  BASE_ARCADE_SCORING_RULES,
  HOUSE_RULES,
  TRINKETS,
  arcadeCardValue,
  calculateArcadeHandValue,
  calculateArcadePayout,
  calculateProfitMultiplier,
  chooseHouseRule,
  compareCardValues,
  createSeededRandom,
  drawWeightedCard,
  maxxedOutCreditMultiplier,
  offerTrinkets,
  randomizeOccupiedTrinkets,
  replaceSlotTwoTrinket,
  lowestCardIndex,
  resolveRubberBandBust,
  resolveArcadeOutcome,
  resolveFiveFingerDiscount,
  shouldArcadeDealerHit,
  splitArcadeCard
} from "../src/index.js";
import type { Card, TrinketSlots } from "../src/index.js";

const card = (rank: Card["rank"], suit: Card["suit"] = "clubs"): Card => ({ rank, suit });

describe("arcade catalogs and rotation", () => {
  it("includes all 36 Trinkets and 11 House Rules", () => {
    expect(TRINKETS).toHaveLength(36);
    expect(HOUSE_RULES).toHaveLength(11);
  });

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

  it("randomizes occupied slots without changing their positions", () => {
    const slots: TrinketSlots = [{ id: "junk-drawer" }, null, { id: "record" }];
    const randomized = randomizeOccupiedTrinkets(slots, createSeededRandom(8));
    expect(randomized[0]).not.toBeNull();
    expect(randomized[1]).toBeNull();
    expect(randomized[2]).not.toBeNull();
    expect(randomized[0]?.id).not.toBe(randomized[2]?.id);
  });

  it("replaces only Slot 2 for Finders Keepers", () => {
    const slots: TrinketSlots = [{ id: "record" }, { id: "dice" }, { id: "hall-pass" }];
    const replaced = replaceSlotTwoTrinket(slots, createSeededRandom(4));
    expect(replaced[0]).toEqual(slots[0]);
    expect(replaced[1]?.id).not.toBe("dice");
    expect(replaced[2]).toEqual(slots[2]);
  });
});

describe("arcade scoring", () => {
  it("uses 17 as the target and Blackjack value for Issue 17", () => {
    const rules = { ...BASE_ARCADE_SCORING_RULES, target: 17 };
    const seventeen = calculateArcadeHandValue([card("10"), card("7")], rules);
    expect(seventeen).toMatchObject({ total: 17, busted: false });
    expect(calculateArcadeHandValue([card("10"), card("8")], rules).busted).toBe(true);
  });

  it("uses Trinket-aware dealer stand rules", () => {
    const value = (total: number) => ({ total, soft: false, busted: false });

    expect(shouldArcadeDealerHit(value(16))).toBe(true);
    expect(shouldArcadeDealerHit(value(17))).toBe(false);
    expect(shouldArcadeDealerHit(value(13), { ...BASE_ARCADE_SCORING_RULES, target: 17 })).toBe(true);
    expect(shouldArcadeDealerHit(value(14), { ...BASE_ARCADE_SCORING_RULES, target: 17 })).toBe(false);
    expect(shouldArcadeDealerHit(value(14), { ...BASE_ARCADE_SCORING_RULES, target: 17 }, false, true)).toBe(false);
    expect(shouldArcadeDealerHit(value(5), BASE_ARCADE_SCORING_RULES, true)).toBe(false);
    expect(shouldArcadeDealerHit(value(20), BASE_ARCADE_SCORING_RULES, false, true)).toBe(true);
  });

  it("supports Broken Calculator and Two-Card Monte face values", () => {
    const value = calculateArcadeHandValue(
      [card("3"), card("8"), card("K")],
      { target: 21, faceCardValue: 13, brokenCalculator: true }
    );
    expect(value.total).toBe(22);
  });

  it("applies The Tower by suit without changing Aces", () => {
    const rules = { ...BASE_ARCADE_SCORING_RULES, blackCardAdjustment: 1, redCardAdjustment: -1 };
    expect(arcadeCardValue(card("8", "clubs"), rules)).toBe(9);
    expect(arcadeCardValue(card("8", "hearts"), rules)).toBe(7);
    expect(arcadeCardValue(card("A", "diamonds"), rules)).toBe(11);
  });

  it("splits odd cards and converts split faces into number cards", () => {
    const nine = splitArcadeCard(card("9"));
    expect([nine.lower.valueOverride, nine.upper.valueOverride]).toEqual([4, 5]);
    const face = splitArcadeCard(card("K", "hearts"));
    expect(face.lower).toMatchObject({ rank: "5", suit: "hearts", valueOverride: 5 });
    expect(face.upper).toMatchObject({ rank: "5", suit: "hearts", valueOverride: 5 });
  });

  it("gives number cards extra draw weight without duplicating cards", () => {
    const deck = [card("A"), card("2")];
    const result = drawWeightedCard(deck, 2, { next: () => 0.4 });
    expect(result.card.rank).toBe("2");
    expect(result.remainingDeck).toEqual([card("A")]);
  });

  it("compares cards and finds the lowest card for interactive effects", () => {
    expect(compareCardValues(card("6"), card("9"))).toBe("higher");
    expect(compareCardValues(card("K"), card("Q"))).toBe("equal");
    expect(lowestCardIndex([card("9"), card("2"), card("5")])).toBe(1);
  });

  it("steals the lowest pre-Hit card before the new card is received", () => {
    const result = resolveFiveFingerDiscount(
      [card("9"), card("8")],
      [card("10")]
    );
    const incomingHitCard = card("2");

    expect(result.stolenCard).toEqual(card("8"));
    expect([...result.playerHand, incomingHitCard]).toEqual([card("9"), card("2")]);
    expect(result.dealerHand).toEqual([card("10"), card("8")]);
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
  it("uses Maxxed Out Credit Card thresholds rounded up", () => {
    expect(maxxedOutCreditMultiplier(24, 101)).toBe(1);
    expect(maxxedOutCreditMultiplier(26, 101)).toBe(2);
    expect(maxxedOutCreditMultiplier(51, 101)).toBe(3);
  });
  it("stacks additive and multiplicative Trinket bonuses", () => {
    expect(calculateProfitMultiplier({
      punchCardHits: 2,
      followedMagic8BallCount: 1,
      correctTradingPredictions: 1,
      sunglasses: true,
      recordBonus: true,
      piggyBankSmash: true,
      bandAidUsed: true
    })).toBe(21);
  });

  it("stacks Magic 8 Ball bonuses across separate followed actions", () => {
    expect(calculateProfitMultiplier({
      punchCardHits: 0,
      followedMagic8BallCount: 2,
      correctTradingPredictions: 0,
      sunglasses: false,
      recordBonus: false,
      piggyBankSmash: false,
      bandAidUsed: false
    })).toBe(2);
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

  it("supports Cash-Only Coupon wins with no dunkaroos", () => {
    expect(calculateArcadePayout({
      outcome: "player-win",
      wager: 10,
      chipsStaked: 10,
      positiveProfitMultiplier: 3,
      dunkaroosPerPositiveChipProfit: 0
    })).toMatchObject({ chipProfit: 30, dunkaroosAwarded: 0 });
  });
});
