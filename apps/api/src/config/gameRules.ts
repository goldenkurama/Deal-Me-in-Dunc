export const GAME_RULES = Object.freeze({
  timeZone: process.env.APP_TIME_ZONE ?? "America/New_York",
  startingChips: 100,
  startingDunkaroos: 0,
  dailyLoginChips: 100,
  dailyDealerCodeChips: 100,
  minimumBet: 10,
  maximumBet: 100,
  betIncrement: 10,
  dealerStandValue: 17,
  blackjackMultiplier: 1.5
});
