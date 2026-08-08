import type { Card, Rank, Suit } from "@fox-blackjack/game-core";

export const CARD_WIDTH = 57;
export const CARD_HEIGHT = 89;

export const CARD_ASSETS = Object.freeze({
  faces: {
    key: "playing-card-faces",
    url: "/assets/cards/playing-card-faces-sheet.png",
    frameWidth: CARD_WIDTH,
    frameHeight: CARD_HEIGHT
  },
  backs: {
    key: "playing-card-backs",
    url: "/assets/cards/playing-card-backs-sheet.png",
    frameWidth: CARD_WIDTH,
    frameHeight: CARD_HEIGHT,
    frames: Object.freeze({
      red: 0,
      teal: 1,
      blue: 2,
      cream: 3
    })
  }
});

const RANK_COLUMNS: Record<Rank, number> = {
  A: 0,
  "2": 1,
  "3": 2,
  "4": 3,
  "5": 4,
  "6": 5,
  "7": 6,
  "8": 7,
  "9": 8,
  "10": 9,
  J: 10,
  Q: 11,
  K: 12
};

const SUIT_ROWS: Record<Suit, number> = {
  clubs: 0,
  diamonds: 1,
  spades: 2,
  hearts: 3
};

export function cardFaceFrame(card: Card): number {
  return SUIT_ROWS[card.suit] * 13 + RANK_COLUMNS[card.rank];
}
