import type {
  Card,
  HandOutcome,
  HandPayoutRules,
  HandResolution,
  HandValue,
  Rank
} from "./types.js";
import { drawCard } from "./cards.js";

function rankValue(rank: Rank): number {
  switch (rank) {
    case "A":
      return 11;
    case "J":
    case "Q":
    case "K":
      return 10;
    default:
      return Number(rank);
  }
}

export function calculateHandValue(cards: readonly Card[]): HandValue {
  let total = 0;
  let acesValuedAtEleven = 0;

  for (const card of cards) {
    total += rankValue(card.rank);

    if (card.rank === "A") {
      acesValuedAtEleven += 1;
    }
  }

  while (total > 21 && acesValuedAtEleven > 0) {
    total -= 10;
    acesValuedAtEleven -= 1;
  }

  return {
    total,
    soft: acesValuedAtEleven > 0,
    busted: total > 21
  };
}

export function isNaturalBlackjack(cards: readonly Card[]): boolean {
  return cards.length === 2 && calculateHandValue(cards).total === 21;
}

/** Deal Me In, Dunc defaults to standing on every 17, including soft 17. */
export function dealerShouldHit(cards: readonly Card[]): boolean {
  return calculateHandValue(cards).total < 17;
}

export interface DealerPlayResult {
  readonly dealerHand: Card[];
  readonly cardsDrawn: Card[];
  readonly remainingDeck: Card[];
}

export function playDealerHand(
  startingHand: readonly Card[],
  startingDeck: readonly Card[]
): DealerPlayResult {
  const dealerHand = [...startingHand];
  const cardsDrawn: Card[] = [];
  let remainingDeck = [...startingDeck];

  while (dealerShouldHit(dealerHand)) {
    const draw = drawCard(remainingDeck);
    dealerHand.push(draw.card);
    cardsDrawn.push(draw.card);
    remainingDeck = draw.remainingDeck;
  }

  return { dealerHand, cardsDrawn, remainingDeck };
}

function validateWager(wager: number): void {
  if (!Number.isSafeInteger(wager) || wager <= 0) {
    throw new Error("Wager must be a positive whole number.");
  }
}

export const BASE_HAND_PAYOUT_RULES: HandPayoutRules = Object.freeze({
  ordinaryWinProfitMultiplier: 1,
  blackjackProfitMultiplier: 1.5,
  dunkaroosPerPositiveChipProfit: 1
});

function validatePayoutRules(rules: HandPayoutRules): void {
  for (const [name, value] of Object.entries(rules)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be a non-negative finite number.`);
    }
  }
}

export function settleHandOutcome(
  outcome: HandOutcome,
  wager: number,
  rules: HandPayoutRules = BASE_HAND_PAYOUT_RULES
): HandResolution {
  validateWager(wager);
  validatePayoutRules(rules);

  let chipProfit: number;
  switch (outcome) {
    case "player-blackjack":
      chipProfit = Math.ceil(wager * rules.blackjackProfitMultiplier);
      break;
    case "player-win":
      chipProfit = Math.ceil(wager * rules.ordinaryWinProfitMultiplier);
      break;
    case "push":
      chipProfit = 0;
      break;
    case "dealer-win":
      chipProfit = -wager;
      break;
  }

  return {
    outcome,
    wager,
    chipsReturned: wager + chipProfit,
    chipProfit,
    dunkaroosAwarded: Math.ceil(
      Math.max(0, chipProfit) * rules.dunkaroosPerPositiveChipProfit
    )
  };
}

/**
 * Resolves a completed hand using the project's base rules:
 * normal wins pay 1:1, blackjack pays 3:2, pushes return the wager,
 * and fractional blackjack profit rounds upward.
 */
export function resolveHand(
  playerCards: readonly Card[],
  dealerCards: readonly Card[],
  wager: number,
  rules: HandPayoutRules = BASE_HAND_PAYOUT_RULES
): HandResolution {
  validateWager(wager);
  validatePayoutRules(rules);

  const playerValue = calculateHandValue(playerCards);
  const dealerValue = calculateHandValue(dealerCards);
  const playerBlackjack = isNaturalBlackjack(playerCards);
  const dealerBlackjack = isNaturalBlackjack(dealerCards);

  if (playerValue.busted) {
    return settleHandOutcome("dealer-win", wager, rules);
  }

  if (playerBlackjack && dealerBlackjack) {
    return settleHandOutcome("push", wager, rules);
  }

  if (playerBlackjack) {
    return settleHandOutcome("player-blackjack", wager, rules);
  }

  if (dealerBlackjack) {
    return settleHandOutcome("dealer-win", wager, rules);
  }

  if (dealerValue.busted || playerValue.total > dealerValue.total) {
    return settleHandOutcome("player-win", wager, rules);
  }

  if (playerValue.total < dealerValue.total) {
    return settleHandOutcome("dealer-win", wager, rules);
  }

  return settleHandOutcome("push", wager, rules);
}
