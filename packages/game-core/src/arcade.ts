import type { RandomSource } from "./random.js";
import { systemRandom } from "./random.js";
import type {
  ActiveHouseRule,
  Card,
  HandOutcome,
  HandValue,
  Rank,
  TrinketSlots
} from "./types.js";
import { startHouseRule } from "./houseRules.js";

export const TRINKET_IDS = [
  "golf-scoring-card",
  "record",
  "sunglasses",
  "trading-card",
  "rubber-chicken",
  "lucky-keychain",
  "gameshark",
  "piggy-bank",
  "band-aid",
  "time-capsule",
  "rubber-band",
  "dice",
  "punch-card",
  "magic-8-ball",
  "issue-17",
  "hall-pass",
  "booster-pack",
  "broken-calculator",
  "safety-scissors",
  "three-ring-binder",
  "participation-trophy",
  "deck-of-many-bs-things",
  "junk-drawer",
  "universal-remote",
  "swap-meet-ticket",
  "loaded-shoe",
  "dry-cleaning-ticket",
  "maxxed-out-credit-card",
  "cash-only-coupon",
  "return-receipt",
  "half-off-coupon",
  "dry-cleaning-tag",
  "bookmark",
  "express-lane-sign",
  "two-for-one-coupon",
  "do-over-token"
] as const;

export type TrinketId = (typeof TRINKET_IDS)[number];
export type TrinketInteraction = "passive" | "click" | "pre-bet";

export interface TrinketDefinition {
  readonly id: TrinketId;
  readonly name: string;
  readonly description: string;
  readonly interaction: TrinketInteraction;
}

export const TRINKETS: readonly TrinketDefinition[] = Object.freeze([
  { id: "golf-scoring-card", name: "Golf Scoring Card", description: "The lower non-busted total wins. Duncan does not Hit.", interaction: "passive" },
  { id: "record", name: "Record", description: "Flip between a face-card win bonus and a no-face-card win bonus.", interaction: "click" },
  { id: "sunglasses", name: "Sunglasses", description: "One of your cards is hidden. Winning profit is tripled.", interaction: "passive" },
  { id: "trading-card", name: "Trading Card", description: "Draw a separate comparison card, then predict whether your next Hit is higher or lower for a +1x win bonus.", interaction: "click" },
  { id: "rubber-chicken", name: "Rubber Chicken", description: "Start Chicken Game. You and Duncan alternate Hits until somebody busts.", interaction: "click" },
  { id: "lucky-keychain", name: "Lucky Keychain", description: "Once per hand, change a visible 6 into a 9 or a 9 into a 6.", interaction: "click" },
  { id: "gameshark", name: "Gameshark", description: "A five-card hand counts as Blackjack, even if its fifth card busts.", interaction: "passive" },
  { id: "piggy-bank", name: "Piggy Bank", description: "Before betting, choose Save or Smash. Save caps the bet at 20 and refunds half a loss. Smash requires 50 and doubles winning profit.", interaction: "pre-bet" },
  { id: "band-aid", name: "Band-Aid", description: "Your first bust loses five total points, but winning profit is halved.", interaction: "passive" },
  { id: "time-capsule", name: "Time Capsule", description: "Remove a card now and receive it as your first Hit card next hand.", interaction: "click" },
  { id: "rubber-band", name: "Rubber Band", description: "On bust, fling the busting card into Duncan's hand. If he busts, push.", interaction: "passive" },
  { id: "dice", name: "Dice", description: "Once per hand, roll two dice and add or subtract one from your total.", interaction: "click" },
  { id: "punch-card", name: "Punch Card", description: "Every Hit adds +0.5x to winning profit.", interaction: "passive" },
  { id: "magic-8-ball", name: "Magic 8 Ball", description: "Follow its Hit-or-Stand advice for a +0.5x win bonus.", interaction: "click" },
  { id: "issue-17", name: "Issue 17", description: "Seventeen replaces 21 for Blackjack and busting. Duncan stands on 14.", interaction: "passive" },
  { id: "hall-pass", name: "Hall Pass", description: "Once per hand, discard one visible card.", interaction: "click" },
  { id: "booster-pack", name: "Booster Pack", description: "At the opening deal, look at three cards and keep two.", interaction: "passive" },
  { id: "broken-calculator", name: "Broken Calculator", description: "Number cards are worth their distance from 10; a 10 is worth zero.", interaction: "passive" },
  { id: "safety-scissors", name: "Safety Scissors", description: "Once per hand, split one non-Ace card and give half to Duncan. Choose who gets the larger odd half.", interaction: "click" },
  { id: "three-ring-binder", name: "Three-Ring Binder", description: "Your hand holds at most three cards. Hitting at the limit discards your oldest card.", interaction: "passive" },
  { id: "participation-trophy", name: "Participation Trophy", description: "Wins at 19 or lower pay double. Winning with 20 or 21 loses the wager.", interaction: "passive" },
  { id: "deck-of-many-bs-things", name: "Deck of Many BS Things", description: "Use before betting for a surprise.", interaction: "pre-bet" },
  { id: "junk-drawer", name: "Junk Drawer", description: "Replace every occupied conveyor slot with a random Trinket in the same position.", interaction: "click" },
  { id: "universal-remote", name: "Universal Remote", description: "Once per hand, replace the House Rule while preserving its remaining duration.", interaction: "click" },
  { id: "swap-meet-ticket", name: "Swap Meet Ticket", description: "Once per hand, swap your entire hand with Duncan's.", interaction: "click" },
  { id: "loaded-shoe", name: "Loaded Shoe", description: "Number cards are twice as likely to be drawn.", interaction: "passive" },
  { id: "dry-cleaning-ticket", name: "Dry-Cleaning Ticket", description: "Once per hand, name a suit and remove all played cards of that suit from both hands.", interaction: "click" },
  { id: "maxxed-out-credit-card", name: "Maxxed Out Credit Card", description: "Bet at least 25% of your chips for 2x profit, or at least 50% for 3x profit.", interaction: "passive" },
  { id: "cash-only-coupon", name: "Cash-Only Coupon", description: "Winning profit is tripled, but wins award no dunkaroos.", interaction: "passive" },
  { id: "return-receipt", name: "Return Receipt", description: "Once per hand, exchange one card with the card on top of the deck.", interaction: "click" },
  { id: "half-off-coupon", name: "Half-Off Coupon", description: "Once per hand, split one non-Ace card into two cards. Face cards become number cards.", interaction: "click" },
  { id: "dry-cleaning-tag", name: "Mini Vacuum", description: "Before betting, name a suit. Win with that suit in your hand for double profit.", interaction: "pre-bet" },
  { id: "bookmark", name: "Bookmark", description: "Once per hand, place Duncan's visible card on top of the deck.", interaction: "click" },
  { id: "express-lane-sign", name: "Express Lane Sign", description: "Winning with three cards or fewer grants 1.5x profit.", interaction: "passive" },
  { id: "two-for-one-coupon", name: "Two-for-One Coupon", description: "On your first Hit, draw two cards, keep one, and discard the other.", interaction: "passive" },
  { id: "do-over-token", name: "Do-Over Token", description: "Once per hand, discard your hand and draw two replacements.", interaction: "click" }
]);

export const HOUSE_RULE_IDS = [
  "five-finger-discount",
  "no-peeking",
  "all-bets-are-off",
  "cheap-trick",
  "two-card-monte",
  "shared-custody",
  "charity-case",
  "musical-chairs",
  "finders-keepers",
  "coward-tax",
  "open-hand-night"
] as const;

export type HouseRuleId = (typeof HOUSE_RULE_IDS)[number];

export interface HouseRuleDefinition {
  readonly id: HouseRuleId;
  readonly name: string;
  readonly description: string;
}

export const HOUSE_RULES: readonly HouseRuleDefinition[] = Object.freeze([
  { id: "five-finger-discount", name: "Five Finger Discount", description: "On your first Hit, Duncan steals your lowest card into his hand." },
  { id: "no-peeking", name: "No Peeking", description: "Both of Duncan's opening cards stay obscured until resolution." },
  { id: "all-bets-are-off", name: "All Bets Are Off", description: "Hands use a free 10-chip wager. Losses cost nothing." },
  { id: "cheap-trick", name: "Cheap Trick", description: "After you Stand, Duncan subtracts one from your total." },
  { id: "two-card-monte", name: "Two-Card Monte", description: "Hands keep at most two cards, discarding the oldest on Hit. Face cards are worth 13." },
  { id: "shared-custody", name: "Shared Custody", description: "You and Duncan share one second card. Its value contributes to both hands." },
  { id: "charity-case", name: "Charity Case", description: "Once per hand when you Hit, Duncan gives you a random card instead of dealing a new one." },
  { id: "musical-chairs", name: "Musical Chairs", description: "Every time you Hit, one random card from each hand swaps places." },
  { id: "finders-keepers", name: "Finders Keepers", description: "At the start of each hand, Duncan randomly replaces your Slot 2 Trinket." },
  { id: "coward-tax", name: "Coward Tax", description: "Standing on 16 or lower halves your winning profit multiplier." },
  { id: "open-hand-night", name: "Open Hand Night", description: "Duncan reveals every card and may discard one card before completing his turn." }
]);

export function isTrinketId(id: string): id is TrinketId {
  return (TRINKET_IDS as readonly string[]).includes(id);
}

export function isHouseRuleId(id: string): id is HouseRuleId {
  return (HOUSE_RULE_IDS as readonly string[]).includes(id);
}

export function getTrinket(id: string): TrinketDefinition {
  const definition = TRINKETS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown Trinket: ${id}`);
  return definition;
}

export function getHouseRule(id: string): HouseRuleDefinition {
  const definition = HOUSE_RULES.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown House Rule: ${id}`);
  return definition;
}

function takeRandom<T>(items: T[], random: RandomSource): T {
  if (items.length === 0) throw new Error("Cannot select from an empty list.");
  const index = Math.min(items.length - 1, Math.floor(random.next() * items.length));
  return items.splice(index, 1)[0] as T;
}

export function offerTrinkets(
  slots: TrinketSlots,
  random: RandomSource = systemRandom
): readonly [TrinketDefinition, TrinketDefinition] {
  const activeIds = new Set(slots.flatMap((slot) => slot ? [slot.id] : []));
  const available = TRINKETS.filter(({ id }) => !activeIds.has(id));
  if (available.length < 2) throw new Error("At least two Trinkets must be available.");
  return [takeRandom(available, random), takeRandom(available, random)];
}

export function chooseHouseRule(
  previousId: string | null = null,
  random: RandomSource = systemRandom
): ActiveHouseRule {
  const available = HOUSE_RULES.filter(({ id }) => id !== previousId);
  return startHouseRule(takeRandom(available, random).id);
}

export interface ArcadeScoringRules {
  readonly target: number;
  readonly faceCardValue: number;
  readonly brokenCalculator: boolean;
  readonly blackCardAdjustment?: number;
  readonly redCardAdjustment?: number;
}

export const BASE_ARCADE_SCORING_RULES: ArcadeScoringRules = Object.freeze({
  target: 21,
  faceCardValue: 10,
  brokenCalculator: false,
  blackCardAdjustment: 0,
  redCardAdjustment: 0
});

export function deriveArcadeScoringRules(
  activeTrinketIds: readonly string[],
  houseRuleId: string,
  towerActive = false
): ArcadeScoringRules {
  return {
    target: activeTrinketIds.includes("issue-17") ? 17 : 21,
    faceCardValue: houseRuleId === "two-card-monte" ? 13 : 10,
    brokenCalculator: activeTrinketIds.includes("broken-calculator"),
    blackCardAdjustment: towerActive ? 1 : 0,
    redCardAdjustment: towerActive ? -1 : 0
  };
}

function arcadeRankValue(rank: Rank, rules: ArcadeScoringRules): number {
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return rules.faceCardValue;
  const value = Number(rank);
  return rules.brokenCalculator ? Math.abs(10 - value) : value;
}

export function arcadeCardValue(
  card: Card,
  rules: ArcadeScoringRules = BASE_ARCADE_SCORING_RULES
): number {
  if (card.valueOverride !== undefined) return card.valueOverride;
  const base = arcadeRankValue(card.rank, rules);
  if (card.rank === "A") return base;
  const adjustment = card.suit === "clubs" || card.suit === "spades"
    ? rules.blackCardAdjustment ?? 0
    : rules.redCardAdjustment ?? 0;
  return Math.max(0, base + adjustment);
}

export function calculateArcadeHandValue(
  cards: readonly Card[],
  rules: ArcadeScoringRules = BASE_ARCADE_SCORING_RULES,
  totalAdjustment = 0
): HandValue {
  let total = totalAdjustment;
  let acesValuedAtEleven = 0;

  for (const card of cards) {
    total += arcadeCardValue(card, rules);
    if (card.rank === "A" && card.valueOverride === undefined) acesValuedAtEleven += 1;
  }

  while (total > rules.target && acesValuedAtEleven > 0) {
    total -= 10;
    acesValuedAtEleven -= 1;
  }

  return {
    total,
    soft: acesValuedAtEleven > 0,
    busted: total > rules.target
  };
}

export function shouldArcadeDealerHit(
  dealerValue: HandValue,
  rules: ArcadeScoringRules = BASE_ARCADE_SCORING_RULES,
  golfScoring = false,
  forcedHits = false
): boolean {
  if (dealerValue.busted || golfScoring) return false;
  if (rules.target === 17) return dealerValue.total < 14;
  return forcedHits || dealerValue.total < 17;
}

export function isArcadeBlackjack(
  cards: readonly Card[],
  value: HandValue,
  rules: ArcadeScoringRules,
  fiveCardBlackjack: boolean
): boolean {
  if (fiveCardBlackjack && cards.length === 5) return true;
  return cards.length === 2 && value.total === rules.target;
}

export interface ArcadeResolutionInput {
  readonly playerValue: HandValue;
  readonly dealerValue: HandValue;
  readonly playerBlackjack: boolean;
  readonly dealerBlackjack: boolean;
  readonly golfScoring: boolean;
}

export function resolveArcadeOutcome(input: ArcadeResolutionInput): HandOutcome {
  const { playerValue, dealerValue } = input;
  if (input.playerBlackjack && input.dealerBlackjack) return "push";
  if (input.playerBlackjack) return "player-blackjack";
  if (input.dealerBlackjack) return "dealer-win";
  if (playerValue.busted) return "dealer-win";
  if (dealerValue.busted) return "player-win";

  if (input.golfScoring) {
    if (playerValue.total < dealerValue.total) return input.playerBlackjack ? "player-blackjack" : "player-win";
    if (playerValue.total > dealerValue.total) return "dealer-win";
    return "push";
  }

  if (playerValue.total > dealerValue.total) return "player-win";
  if (playerValue.total < dealerValue.total) return "dealer-win";
  return "push";
}

export interface ArcadePayoutInput {
  readonly outcome: HandOutcome;
  readonly wager: number;
  readonly chipsStaked: number;
  readonly positiveProfitMultiplier: number;
  readonly lossRefundFraction?: number;
  readonly dunkaroosPerPositiveChipProfit?: number;
}

export interface ProfitMultiplierInput {
  readonly punchCardHits: number;
  readonly followedMagic8BallCount: number;
  readonly correctTradingPredictions: number;
  readonly sunglasses: boolean;
  readonly recordBonus: boolean;
  readonly piggyBankSmash: boolean;
  readonly bandAidUsed: boolean;
}

export function calculateProfitMultiplier(input: ProfitMultiplierInput): number {
  if (!Number.isSafeInteger(input.punchCardHits) || input.punchCardHits < 0) throw new Error("Punch Card Hits must be a non-negative whole number.");
  if (!Number.isSafeInteger(input.correctTradingPredictions) || input.correctTradingPredictions < 0) throw new Error("Correct predictions must be a non-negative whole number.");
  let multiplier = 1 + input.punchCardHits * 0.5;
  multiplier += input.followedMagic8BallCount * 0.5;
  multiplier += input.correctTradingPredictions;
  if (input.sunglasses) multiplier *= 3;
  if (input.recordBonus) multiplier *= 2;
  if (input.piggyBankSmash) multiplier *= 2;
  if (input.bandAidUsed) multiplier *= 0.5;
  return multiplier;
}

export function compareCardValues(
  comparison: Card,
  next: Card
): "higher" | "lower" | "equal" {
  const comparisonValue = calculateArcadeHandValue([comparison]).total;
  const nextValue = calculateArcadeHandValue([next]).total;
  if (nextValue > comparisonValue) return "higher";
  if (nextValue < comparisonValue) return "lower";
  return "equal";
}

export type DeckOfManyEffect = "fool" | "tower" | "world";

export function chooseDeckOfManyEffect(random: RandomSource = systemRandom): DeckOfManyEffect {
  const effects: DeckOfManyEffect[] = ["fool", "tower", "world"];
  return takeRandom(effects, random);
}

export function drawWeightedCard(
  deck: readonly Card[],
  numberCardWeight = 2,
  random: RandomSource = systemRandom
): { readonly card: Card; readonly remainingDeck: Card[] } {
  if (deck.length === 0) throw new Error("Cannot draw from an empty deck.");
  if (!Number.isFinite(numberCardWeight) || numberCardWeight <= 0) {
    throw new Error("Number-card weight must be positive and finite.");
  }
  const weights = deck.map(({ rank }) => {
    const numeric = Number(rank);
    return Number.isInteger(numeric) && numeric >= 2 && numeric <= 10 ? numberCardWeight : 1;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random.next() * totalWeight;
  let index = deck.length - 1;
  for (let candidate = 0; candidate < weights.length; candidate += 1) {
    roll -= weights[candidate] ?? 0;
    if (roll < 0) {
      index = candidate;
      break;
    }
  }
  const remainingDeck = [...deck];
  const [card] = remainingDeck.splice(index, 1);
  if (!card) throw new Error("Cannot draw from an empty deck.");
  return { card, remainingDeck };
}

export function createWeightedDeckOrder(
  deck: readonly Card[],
  numberCardWeight = 2,
  random: RandomSource = systemRandom
): Card[] {
  const ordered: Card[] = [];
  let remaining = [...deck];
  while (remaining.length > 0) {
    const draw = drawWeightedCard(remaining, numberCardWeight, random);
    ordered.push(draw.card);
    remaining = draw.remainingDeck;
  }
  return ordered;
}

function splitRank(value: number): Rank {
  if (value >= 2 && value <= 10) return String(value) as Rank;
  return value === 1 ? "A" : "10";
}

export interface SplitCardResult {
  readonly lower: Card;
  readonly upper: Card;
}

export function splitArcadeCard(
  card: Card,
  rules: ArcadeScoringRules = BASE_ARCADE_SCORING_RULES
): SplitCardResult {
  if (card.rank === "A" && card.valueOverride === undefined) {
    throw new Error("Aces cannot be split.");
  }
  const value = arcadeCardValue(card, rules);
  const lowerValue = Math.floor(value / 2);
  const upperValue = Math.ceil(value / 2);
  return {
    lower: { suit: card.suit, rank: splitRank(lowerValue), valueOverride: lowerValue },
    upper: { suit: card.suit, rank: splitRank(upperValue), valueOverride: upperValue }
  };
}

export function randomizeOccupiedTrinkets(
  slots: TrinketSlots,
  random: RandomSource = systemRandom
): TrinketSlots {
  const available = [...TRINKETS];
  const next = slots.map((slot) => slot ? { id: takeRandom(available, random).id } : null);
  return next as unknown as TrinketSlots;
}

export function replaceSlotTwoTrinket(
  slots: TrinketSlots,
  random: RandomSource = systemRandom
): TrinketSlots {
  if (!slots[1]) return [...slots];
  const excluded = new Set(slots.flatMap((slot, index) => index === 1 || !slot ? [] : [slot.id]));
  excluded.add(slots[1].id);
  const available = TRINKETS.filter(({ id }) => !excluded.has(id));
  if (available.length === 0) return [...slots];
  return [slots[0], { id: takeRandom(available, random).id }, slots[2]];
}

export function maxxedOutCreditMultiplier(wager: number, balanceBeforeBet: number): number {
  if (balanceBeforeBet <= 0 || wager < Math.ceil(balanceBeforeBet * 0.25)) return 1;
  return wager >= Math.ceil(balanceBeforeBet * 0.5) ? 3 : 2;
}

export interface RubberBandBustResult {
  readonly playerHand: readonly Card[];
  readonly dealerHand: readonly Card[];
  readonly flungCard: Card | null;
  readonly outcome: "push" | "dealer-win";
}

export function resolveRubberBandBust(
  playerHand: readonly Card[],
  dealerHand: readonly Card[],
  rules: ArcadeScoringRules = BASE_ARCADE_SCORING_RULES
): RubberBandBustResult {
  const nextPlayerHand = [...playerHand];
  const flungCard = nextPlayerHand.pop() ?? null;
  const nextDealerHand = flungCard ? [...dealerHand, flungCard] : [...dealerHand];
  return {
    playerHand: nextPlayerHand,
    dealerHand: nextDealerHand,
    flungCard,
    outcome: calculateArcadeHandValue(nextDealerHand, rules).busted ? "push" : "dealer-win"
  };
}

export function lowestCardIndex(
  cards: readonly Card[],
  rules: ArcadeScoringRules = BASE_ARCADE_SCORING_RULES
): number | null {
  if (cards.length === 0) return null;
  let lowestIndex = 0;
  let lowestValue = Number.POSITIVE_INFINITY;
  cards.forEach((card, index) => {
    const value = calculateArcadeHandValue([card], rules).total;
    if (value < lowestValue) {
      lowestValue = value;
      lowestIndex = index;
    }
  });
  return lowestIndex;
}

export interface FiveFingerDiscountResult {
  readonly playerHand: readonly Card[];
  readonly dealerHand: readonly Card[];
  readonly stolenCard: Card | null;
}

export function resolveFiveFingerDiscount(
  playerHandBeforeHit: readonly Card[],
  dealerHand: readonly Card[],
  rules: ArcadeScoringRules = BASE_ARCADE_SCORING_RULES
): FiveFingerDiscountResult {
  const nextPlayerHand = [...playerHandBeforeHit];
  const lowestIndex = lowestCardIndex(nextPlayerHand, rules);
  if (lowestIndex === null) {
    return { playerHand: nextPlayerHand, dealerHand: [...dealerHand], stolenCard: null };
  }

  const [stolenCard = null] = nextPlayerHand.splice(lowestIndex, 1);
  return {
    playerHand: nextPlayerHand,
    dealerHand: stolenCard ? [...dealerHand, stolenCard] : [...dealerHand],
    stolenCard
  };
}

export interface ArcadePayout {
  readonly outcome: HandOutcome;
  readonly wager: number;
  readonly chipsStaked: number;
  readonly chipsAwarded: number;
  readonly chipProfit: number;
  readonly dunkaroosAwarded: number;
}

export function calculateArcadePayout(input: ArcadePayoutInput): ArcadePayout {
  if (!Number.isSafeInteger(input.wager) || input.wager <= 0) throw new Error("Wager must be a positive whole number.");
  if (!Number.isSafeInteger(input.chipsStaked) || input.chipsStaked < 0 || input.chipsStaked > input.wager) throw new Error("Chips staked must be a whole number between zero and the wager.");
  if (!Number.isFinite(input.positiveProfitMultiplier) || input.positiveProfitMultiplier < 0) throw new Error("Profit multiplier must be non-negative and finite.");
  const refundFraction = input.lossRefundFraction ?? 0;
  const dunkarooRate = input.dunkaroosPerPositiveChipProfit ?? 1;
  if (!Number.isFinite(refundFraction) || refundFraction < 0 || refundFraction > 1) throw new Error("Loss refund fraction must be between zero and one.");
  if (!Number.isFinite(dunkarooRate) || dunkarooRate < 0) throw new Error("Dunkaroo rate must be non-negative and finite.");

  let chipsAwarded: number;
  if (input.outcome === "player-win" || input.outcome === "player-blackjack") {
    const blackjackMultiplier = input.outcome === "player-blackjack" ? 1.5 : 1;
    const profit = Math.ceil(input.wager * blackjackMultiplier * input.positiveProfitMultiplier);
    chipsAwarded = input.chipsStaked + profit;
  } else if (input.outcome === "push") {
    chipsAwarded = input.chipsStaked;
  } else {
    chipsAwarded = Math.ceil(input.wager * refundFraction);
  }

  const chipProfit = chipsAwarded - input.chipsStaked;
  return {
    outcome: input.outcome,
    wager: input.wager,
    chipsStaked: input.chipsStaked,
    chipsAwarded,
    chipProfit,
    dunkaroosAwarded: Math.ceil(Math.max(0, chipProfit) * dunkarooRate)
  };
}
