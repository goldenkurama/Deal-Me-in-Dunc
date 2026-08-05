import type { Card } from "./types.js";
import { RANKS, SUITS } from "./types.js";
import type { RandomSource } from "./random.js";
import { systemRandom } from "./random.js";

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));
}

/** Fisher–Yates shuffle. The input deck is not mutated. */
export function shuffleDeck(
  deck: readonly Card[],
  random: RandomSource = systemRandom
): Card[] {
  const shuffled = [...deck];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random.next() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index]
    ];
  }

  return shuffled;
}

export interface DrawResult {
  readonly card: Card;
  readonly remainingDeck: Card[];
}

export function drawCard(deck: readonly Card[]): DrawResult {
  const card = deck[0];

  if (!card) {
    throw new Error("Cannot draw from an empty deck.");
  }

  return {
    card,
    remainingDeck: deck.slice(1)
  };
}

export interface OpeningDeal {
  readonly playerHand: Card[];
  readonly dealerHand: Card[];
  readonly remainingDeck: Card[];
}

/** Deals player, dealer, player, dealer. Hiding a dealer card is a UI concern. */
export function dealOpeningHands(deck: readonly Card[]): OpeningDeal {
  if (deck.length < 4) {
    throw new Error("At least four cards are required for an opening deal.");
  }

  return {
    playerHand: [deck[0], deck[2]],
    dealerHand: [deck[1], deck[3]],
    remainingDeck: deck.slice(4)
  };
}

export function cardKey(card: Card): string {
  return `${card.rank}-${card.suit}`;
}
