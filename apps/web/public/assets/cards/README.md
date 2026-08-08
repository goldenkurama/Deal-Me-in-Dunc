Card sprite contract
====================

Every card is 57 x 89 pixels and is rendered at its native size.

- `playing-card-faces-sheet.png`: 13 columns x 4 rows, with no gaps.
  Rank order is A, 2-10, J, Q, K. Suit order is clubs, diamonds, spades,
  hearts.
- `playing-card-backs-sheet.png`: 4 columns x 1 row, with no gaps.
  Back order is red, teal, blue, cream. Red is the current default.

Replacement sheets must keep these dimensions and cell orders unless the
manifest in `src/assets/cardAssets.ts` is updated at the same time.
