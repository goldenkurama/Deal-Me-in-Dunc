export const SUITS = ["clubs", "diamonds", "hearts", "spades"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K"
] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
}

export interface HandValue {
  readonly total: number;
  readonly soft: boolean;
  readonly busted: boolean;
}

export type HandOutcome =
  | "player-blackjack"
  | "player-win"
  | "dealer-win"
  | "push";

/**
 * The wager is assumed to have already been removed from the player's balance.
 * `chipsReturned` is therefore the amount credited when the hand resolves.
 * `chipProfit` is net profit relative to the wager and may be negative.
 */
export interface HandResolution {
  readonly outcome: HandOutcome;
  readonly wager: number;
  readonly chipsReturned: number;
  readonly chipProfit: number;
  readonly dunkaroosAwarded: number;
}

/**
 * Final payout values used to settle a hand. Trinkets may derive an adjusted
 * copy, then an active House Rule can apply the final override before calling
 * `resolveHand`.
 */
export interface HandPayoutRules {
  readonly ordinaryWinProfitMultiplier: number;
  readonly blackjackProfitMultiplier: number;
  readonly dunkaroosPerPositiveChipProfit: number;
}

export interface ActiveTrinket {
  readonly id: string;
}

/** Slot 0 is newest; slot 2 is oldest and expires next. */
export type TrinketSlots = readonly [
  ActiveTrinket | null,
  ActiveTrinket | null,
  ActiveTrinket | null
];

export interface ActiveHouseRule {
  readonly id: string;
  readonly handsRemaining: number;
}
