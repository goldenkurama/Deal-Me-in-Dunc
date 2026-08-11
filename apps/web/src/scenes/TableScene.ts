import Phaser from "phaser";
import type { PublicUser } from "@fox-blackjack/shared-types";
import {
  EMPTY_TRINKET_SLOTS,
  ageTrinketConveyor,
  advanceHouseRuleAfterHand,
  calculateArcadeHandValue,
  calculateArcadePayout,
  calculateProfitMultiplier,
  cardKey,
  chooseHouseRule,
  compareCardValues,
  createDeck,
  dealOpeningHands,
  drawCard,
  getHouseRule,
  getTrinket,
  insertSelectedTrinket,
  isArcadeBlackjack,
  offerTrinkets,
  lowestCardIndex,
  deriveArcadeScoringRules,
  resolveArcadeOutcome,
  resolveRubberBandBust,
  shuffleDeck,
  type ActiveHouseRule,
  type ArcadePayout,
  type ArcadeScoringRules,
  type Card,
  type HandOutcome,
  type TrinketDefinition,
  type TrinketId,
  type TrinketSlots
} from "@fox-blackjack/game-core";
import { Dealer } from "../objects/Dealer";
import { TrinketConveyor } from "../objects/TrinketConveyor";
import { GAME_FONT_FAMILY, GAME_NUMBER_FONT_FAMILY } from "../config/typography";
import { settleCompletedHand } from "../api/gameApi";
import {
  CARD_ASSETS,
  CARD_WIDTH,
  GAME_MUSIC,
  GAME_SFX,
  SCENE_ASSETS,
  TRINKET_ASSETS,
  cardFaceFrame,
  trinketTextureKey
} from "../assets";
import { AudioManager } from "../audio/AudioManager";
import {
  selectDuncanCycleDialogue,
  type DuncanDialogueScript
} from "../dialogue/duncanDialogue";

const MINIMUM_BET = 10;
const BET_INCREMENT = 10;
const HOUSE_RULE_CHANGE_DELAY_MS = 2_000;

type TablePhase =
  | "betting"
  | "opening"
  | "playing"
  | "settling"
  | "retry"
  | "selecting";
type PiggyChoice = "save" | "smash";
type RecordMode = "face" | "no-face";
type Advice = "hit" | "stand";
type Prediction = "higher" | "lower";

export class TableScene extends Phaser.Scene {
  private dealer!: Dealer;
  private audio!: AudioManager;
  private conveyor!: TrinketConveyor;
  private houseRule!: ActiveHouseRule;
  private trinkets: TrinketSlots = [...EMPTY_TRINKET_SLOTS];

  private deck: Card[] = [];
  private playerHand: Card[] = [];
  private dealerHand: Card[] = [];
  private phase: TablePhase = "betting";

  private statusText!: Phaser.GameObjects.Text;
  private dealerTotalText!: Phaser.GameObjects.Text;
  private playerTotalText!: Phaser.GameObjects.Text;
  private balancesText!: Phaser.GameObjects.Text;
  private betText!: Phaser.GameObjects.Text;
  private houseRuleText!: Phaser.GameObjects.Text;
  private houseRulePanel!: Phaser.GameObjects.Graphics;
  private hitButton!: Phaser.GameObjects.Text;
  private standButton!: Phaser.GameObjects.Text;
  private decreaseBetButton!: Phaser.GameObjects.Text;
  private betButton!: Phaser.GameObjects.Text;
  private increaseBetButton!: Phaser.GameObjects.Text;
  private renderedCards: Phaser.GameObjects.Image[] = [];
  private modalObjects: Phaser.GameObjects.GameObject[] = [];

  private chips = 100;
  private dunkaroos = 0;
  private selectedBet = MINIMUM_BET;
  private activeWager = 0;
  private activeStake = 0;
  private activeHandId = "";
  private completedHands = 0;
  private consecutiveLosses = 0;
  private hitAtEighteenOrHigher = false;

  private hitCount = 0;
  private playerTotalAdjustment = 0;
  private piggyChoice: PiggyChoice | null = null;
  private recordMode: RecordMode = "face";
  private bandAidUsed = false;
  private luckyKeychainUsed = false;
  private diceUsed = false;
  private hallPassUsed = false;
  private timeCapsuleUsed = false;
  private magicAdvice: Advice | null = null;
  private followedMagicAdviceCount = 0;
  private tradingComparison: Card | null = null;
  private tradingPrediction: Prediction | null = null;
  private correctTradingPredictions = 0;
  private fiveFingerUsed = false;
  private chickenActive = false;
  private hiddenPlayerCardIndex: number | null = null;
  private pendingTimeCapsuleCard: Card | null = null;
  private timeCapsuleHitCard: Card | null = null;
  private forcedOutcome: HandOutcome | null = null;
  private handResolutionNote = "";

  constructor() {
    super("TableScene");
  }

  create(): void {
    this.resetRunState();
    this.audio = new AudioManager(this);
    this.startSoundtrack();
    const user = this.registry.get("currentUser") as PublicUser;
    this.chips = user.chips;
    this.dunkaroos = user.dunkaroos;
    this.houseRule = chooseHouseRule();

    this.drawRoom();
    this.dealer = new Dealer(this, 480, 300).fitInside(320, 250);
    this.conveyor = new TrinketConveyor(this, 14, 165);
    this.conveyor.setSlots(this.trinkets, (id) => void this.useTrinket(id));
    this.drawHouseRulePanel();

    this.statusText = this.add
      .text(28, 88, "", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "13px",
        color: "#f6e8c8",
        align: "left",
        wordWrap: { width: 235 },
        lineSpacing: 3
      })
      .setOrigin(0, 0);

    this.add
      .text(700, 337, "DEALER", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "15px",
        color: "#d9c9a5"
      })
      .setOrigin(1, 0.5);

    this.dealerTotalText = this.add
      .text(710, 337, "", {
        fontFamily: GAME_NUMBER_FONT_FAMILY,
        fontStyle: "bold",
        fontSize: "18px",
        color: "#d9c9a5"
      })
      .setOrigin(0, 0.5);

    this.add
      .text(700, 426, "YOU", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "15px",
        color: "#f6e8c8"
      })
      .setOrigin(1, 0.5);

    this.playerTotalText = this.add
      .text(710, 426, "", {
        fontFamily: GAME_NUMBER_FONT_FAMILY,
        fontStyle: "bold",
        fontSize: "18px",
        color: "#f6e8c8"
      })
      .setOrigin(0, 0.5);

    this.add
      .text(830, 30, "CHIPS\nDUNKAROOS", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "15px",
        color: "#f7d56b",
        lineSpacing: 5
      })
      .setOrigin(0, 0);

    this.balancesText = this.add
      .text(820, 28, "", {
        fontFamily: GAME_NUMBER_FONT_FAMILY,
        fontStyle: "bold",
        fontSize: "18px",
        color: "#f7d56b",
        align: "right",
        lineSpacing: 1
      })
      .setOrigin(1, 0);

    this.hitButton = this.createButton(375, 495, "HIT", () => this.hit());
    this.standButton = this.createButton(585, 495, "STAND", () => this.stand());
    this.decreaseBetButton = this.createButton(350, 495, "-10", () => this.adjustBet(-BET_INCREMENT))
      .setFontSize(18)
      .setPadding(14, 9);
    this.betButton = this.createButton(480, 495, "", () => void this.startRound(), GAME_SFX.bet.key)
      .setFontSize(18)
      .setPadding(20, 9);
    this.increaseBetButton = this.createButton(610, 495, "+10", () => this.adjustBet(BET_INCREMENT))
      .setFontSize(18)
      .setPadding(14, 9);
    this.createButton(805, 495, "LOBBY", () => this.scene.start("LobbyScene"))
      .setFontSize(17)
      .setPadding(15, 9);

    this.input.keyboard?.on("keydown-H", () => this.hit());
    this.input.keyboard?.on("keydown-S", () => this.stand());
    this.input.keyboard?.on("keydown-N", () => void this.startRound());
    this.input.keyboard?.on("keydown-B", () => void this.startRound());
    this.input.keyboard?.on("keydown-LEFT", () => this.adjustBet(-BET_INCREMENT));
    this.input.keyboard?.on("keydown-RIGHT", () => this.adjustBet(BET_INCREMENT));

    this.refreshBalances();
    this.refreshHouseRule();
    this.enterBettingState("");
  }

  private resetRunState(): void {
    this.trinkets = [...EMPTY_TRINKET_SLOTS];
    this.deck = [];
    this.playerHand = [];
    this.dealerHand = [];
    this.phase = "betting";
    this.selectedBet = MINIMUM_BET;
    this.activeWager = 0;
    this.activeStake = 0;
    this.activeHandId = "";
    this.completedHands = 0;
    this.consecutiveLosses = 0;
    this.piggyChoice = null;
    this.recordMode = "face";
    this.pendingTimeCapsuleCard = null;
    this.timeCapsuleHitCard = null;
    this.renderedCards = [];
    this.modalObjects = [];
    this.resetHandEffects();
  }

  private startSoundtrack(): void {
    this.audio.stopLoop(GAME_MUSIC.switchWithMe.key);
    this.audio.playLoop(GAME_MUSIC.breakbeatChips.key);
    this.audio.playLoop(GAME_MUSIC.rain.key, 0.2);
  }

  private drawRoom(): void {
    if (this.textures.exists(SCENE_ASSETS.room.key)) {
      this.add
        .image(0, 0, SCENE_ASSETS.room.key)
        .setOrigin(0)
        .setDisplaySize(SCENE_ASSETS.room.width, SCENE_ASSETS.room.height);
    } else {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x33271d);
      graphics.fillRect(0, 0, 960, 300);
      graphics.fillStyle(0x241b14);
      graphics.fillRect(0, 0, 960, 78);
      graphics.fillStyle(0x8d6840);
      graphics.fillRect(0, 76, 960, 5);
      graphics.fillStyle(0x234c35);
      graphics.fillRoundedRect(60, 270, 840, 310, 135);
      graphics.lineStyle(14, 0x5b3b28);
      graphics.strokeRoundedRect(60, 270, 840, 310, 135);
      graphics.fillStyle(0x071c16, 0.35);
      graphics.fillEllipse(480, 405, 540, 180);
    }

    this.add
      .text(28, 28, "DEAL ME IN, DUNC", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "24px",
        color: "#f6e8c8"
      })
      .setOrigin(0, 0.5);

    this.betText = this.add
      .text(28, 55, "", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "16px",
        color: "#d9c9a5"
      })
      .setOrigin(0, 0.5);
  }

  private drawHouseRulePanel(): void {
    this.houseRulePanel = this.add.graphics();
    this.houseRulePanel.fillStyle(0xe5c99b, 0.97);
    this.houseRulePanel.fillRoundedRect(690, 128, 245, 132, 10);
    this.houseRulePanel.lineStyle(5, 0x5b3b28);
    this.houseRulePanel.strokeRoundedRect(690, 128, 245, 132, 10);
    this.houseRuleText = this.add
      .text(812, 145, "", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "13px",
        color: "#2a1b13",
        align: "center",
        wordWrap: { width: 215 },
        lineSpacing: 4
      })
      .setOrigin(0.5, 0);
  }

  private refreshHouseRule(): void {
    const rule = getHouseRule(this.houseRule.id);
    this.houseRuleText.setText(
      `HOUSE RULE (${this.houseRule.handsRemaining})\n${rule.name.toUpperCase()}\n${rule.description}`
    );
  }

  private async replaceHouseRule(nextRule: ActiveHouseRule): Promise<void> {
    this.houseRulePanel.setVisible(false);
    this.houseRuleText.setVisible(false);
    await this.delay(HOUSE_RULE_CHANGE_DELAY_MS);
    if (!this.scene.isActive()) return;

    this.houseRule = nextRule;
    this.refreshHouseRule();
    this.houseRulePanel.setVisible(true);
    this.houseRuleText.setVisible(true);
    this.audio.playEffect(GAME_SFX.newRule.key);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    soundKey: string = GAME_SFX.menuClick.key
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "24px",
        color: "#f6e8c8",
        backgroundColor: "#5b3b28",
        padding: { x: 24, y: 11 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => {
      this.audio.playEffect(soundKey);
      onClick();
    });
    button.on("pointerover", () => button.setScale(1.04));
    button.on("pointerout", () => button.setScale(1));
    return button;
  }

  private hasTrinket(id: TrinketId): boolean {
    return this.trinkets.some((slot) => slot?.id === id);
  }

  /** Slots are ordered newest to oldest, so the first matching Trinket wins a conflict. */
  private newestTrinket(ids: readonly TrinketId[]): TrinketId | null {
    const match = this.trinkets.find((slot) => slot && ids.includes(slot.id as TrinketId));
    return match ? match.id as TrinketId : null;
  }

  private hasHouseRule(id: ActiveHouseRule["id"]): boolean {
    return this.houseRule.id === id;
  }

  private scoringRules(): ArcadeScoringRules {
    return deriveArcadeScoringRules(
      this.trinkets.flatMap((slot) => slot ? [slot.id] : []),
      this.houseRule.id
    );
  }

  private playerValue() {
    return calculateArcadeHandValue(
      this.playerHand,
      this.scoringRules(),
      this.playerTotalAdjustment
    );
  }

  private dealerValue() {
    return calculateArcadeHandValue(this.dealerHand, this.scoringRules());
  }

  private maximumAvailableBet(): number {
    if (this.hasHouseRule("all-bets-are-off")) return 10;
    if (this.piggyChoice === "save") return Math.min(20, this.chips);
    return this.chips;
  }

  private minimumAvailableBet(): number {
    if (this.hasHouseRule("all-bets-are-off")) return 10;
    return this.piggyChoice === "smash" ? 50 : MINIMUM_BET;
  }

  private adjustBet(change: number): void {
    if (this.phase !== "betting") return;
    if (this.hasTrinket("piggy-bank") && !this.piggyChoice && !this.hasHouseRule("all-bets-are-off")) return;
    const minimum = this.minimumAvailableBet();
    const maximum = this.maximumAvailableBet();
    if (maximum < minimum) return;
    this.selectedBet = Phaser.Math.Clamp(this.selectedBet + change, minimum, maximum);
    this.refreshBetControls();
  }

  private async startRound(): Promise<void> {
    if (this.phase === "retry") {
      await this.finishResolvedHand();
      return;
    }
    if (this.phase !== "betting") return;

    const freeHand = this.hasHouseRule("all-bets-are-off");
    if (this.hasTrinket("piggy-bank") && !this.piggyChoice && !freeHand) {
      await this.choosePiggyMode();
      return;
    }

    const minimum = this.minimumAvailableBet();
    const maximum = this.maximumAvailableBet();
    if (maximum < minimum) {
      this.statusText.setText(`Not enough chips for the ${minimum}-chip minimum.`);
      return;
    }

    this.selectedBet = freeHand ? 10 : Phaser.Math.Clamp(this.selectedBet, minimum, maximum);
    this.activeWager = this.selectedBet;
    this.activeStake = freeHand ? 0 : this.selectedBet;
    this.activeHandId = crypto.randomUUID();
    this.chips -= this.activeStake;
    this.resetHandEffects();
    this.phase = "opening";
    this.refreshBalances();
    this.hideAllActionControls();

    let shuffledDeck = shuffleDeck(createDeck());
    this.timeCapsuleHitCard = this.pendingTimeCapsuleCard;
    this.pendingTimeCapsuleCard = null;
    if (this.timeCapsuleHitCard) {
      const storedKey = cardKey(this.timeCapsuleHitCard);
      const storedIndex = shuffledDeck.findIndex((card) => cardKey(card) === storedKey);
      if (storedIndex >= 0) shuffledDeck.splice(storedIndex, 1);
    }

    const openingDeal = dealOpeningHands(shuffledDeck);
    this.playerHand = openingDeal.playerHand;
    this.dealerHand = openingDeal.dealerHand;
    this.deck = openingDeal.remainingDeck;

    if (this.hasTrinket("booster-pack")) {
      const extra = this.takeCard();
      this.playerHand = [...this.playerHand, extra];
      this.refreshHandCards(false, true);
      const kept = await this.chooseTwoCards(this.playerHand);
      if (!kept || !this.scene.isActive()) return;
      this.playerHand = kept;
    }

    if (this.hasTrinket("sunglasses")) {
      this.hiddenPlayerCardIndex = Math.floor(Math.random() * this.playerHand.length);
    }

    this.phase = "playing";
    this.statusText.setText("");
    this.showPlayingControls();
    this.refreshHandCards(false);

    if (this.handlePlayerTerminal()) return;
    if (this.dealerValue().busted || this.currentPlayerBlackjack() || this.currentDealerBlackjack()) {
      void this.finishResolvedHand();
    }
  }

  private resetHandEffects(): void {
    this.hitCount = 0;
    this.playerTotalAdjustment = 0;
    this.bandAidUsed = false;
    this.luckyKeychainUsed = false;
    this.diceUsed = false;
    this.hallPassUsed = false;
    this.timeCapsuleUsed = false;
    this.magicAdvice = null;
    this.followedMagicAdviceCount = 0;
    this.tradingComparison = null;
    this.tradingPrediction = null;
    this.correctTradingPredictions = 0;
    this.fiveFingerUsed = false;
    this.chickenActive = false;
    this.hiddenPlayerCardIndex = null;
    this.forcedOutcome = null;
    this.handResolutionNote = "";
    this.hitAtEighteenOrHigher = false;
  }

  private takeCard(): Card {
    const result = drawCard(this.deck);
    this.deck = result.remainingDeck;
    return result.card;
  }

  private nextPlayerHitCard(): Card {
    if (this.timeCapsuleHitCard) {
      const card = this.timeCapsuleHitCard;
      this.timeCapsuleHitCard = null;
      return card;
    }
    return this.takeCard();
  }

  private hit(): void {
    if (this.phase !== "playing" || this.chickenActive) return;
    this.performPlayerHit();
  }

  private performPlayerHit(): boolean {
    if (this.playerValue().total >= 18) this.hitAtEighteenOrHigher = true;
    this.resolveMagicAdvice("hit");

    const drawn = this.nextPlayerHitCard();
    this.playerHand.push(drawn);
    this.hitCount += 1;
    if (this.hasHouseRule("two-card-monte") && this.playerHand.length > 2) {
      this.playerHand.shift();
    }

    this.resolveTradingPrediction(drawn);
    this.applyFiveFingerDiscount();
    this.refreshHandCards(false);
    return this.handlePlayerTerminal();
  }

  private resolveTradingPrediction(drawn: Card): void {
    if (!this.tradingPrediction || !this.tradingComparison) return;
    const correct = compareCardValues(this.tradingComparison, drawn) === this.tradingPrediction;
    if (correct) this.correctTradingPredictions += 1;
    this.statusText.setText(correct ? "TRADING CARD: CORRECT! +1x PROFIT." : "TRADING CARD: MISSED.");
    this.tradingPrediction = null;
    this.tradingComparison = null;
  }

  private applyFiveFingerDiscount(): void {
    if (!this.hasHouseRule("five-finger-discount") || this.fiveFingerUsed || this.playerHand.length === 0) return;
    this.fiveFingerUsed = true;
    const lowestIndex = lowestCardIndex(this.playerHand, this.scoringRules());
    if (lowestIndex === null) return;
    const [stolen] = this.playerHand.splice(lowestIndex, 1);
    if (stolen) this.dealerHand.push(stolen);
    this.statusText.setText("FIVE FINGER DISCOUNT: DUNCAN STOLE YOUR LOWEST CARD.");
  }

  private handlePlayerTerminal(): boolean {
    if (this.currentPlayerBlackjack()) {
      void this.finishResolvedHand();
      return true;
    }

    if (!this.playerValue().busted) return false;
    const bustTrinket = this.newestTrinket(["band-aid", "rubber-band"]);
    if (bustTrinket === "band-aid" && !this.bandAidUsed) {
      this.bandAidUsed = true;
      this.playerTotalAdjustment -= 5;
      this.statusText.setText("BAND-AID: FIVE POINTS REMOVED FROM YOUR BUST.");
      this.refreshHandCards(false);
      if (!this.playerValue().busted) return false;
    }

    if (bustTrinket === "rubber-band" || this.hasTrinket("rubber-band")) {
      const result = resolveRubberBandBust(this.playerHand, this.dealerHand, this.scoringRules());
      this.playerHand = [...result.playerHand];
      this.dealerHand = [...result.dealerHand];
      this.forcedOutcome = result.outcome;
      this.handResolutionNote = result.outcome === "push"
        ? "RUBBER BAND FLUNG YOUR BUST CARD TO DUNCAN. HE BUSTED TOO!"
        : "RUBBER BAND FLUNG YOUR BUST CARD TO DUNCAN, BUT HE SURVIVED.";
      this.statusText.setText(this.handResolutionNote);
      this.refreshHandCards(false);
      this.hideAllActionControls();
      this.phase = "opening";
      void this.delay(1_000).then(() => {
        if (this.scene.isActive()) void this.finishResolvedHand();
      });
      return true;
    }
    void this.finishResolvedHand();
    return true;
  }

  private stand(): void {
    if (this.phase !== "playing" || this.chickenActive) return;
    this.resolveMagicAdvice("stand");
    if (this.hasHouseRule("cheap-trick")) this.playerTotalAdjustment -= 1;
    this.playDealerHand();
    void this.finishResolvedHand();
  }

  private playDealerHand(): void {
    let drawsRemaining = this.deck.length;
    while (this.dealerValue().total < 17 && drawsRemaining > 0) {
      this.dealerHand.push(this.takeCard());
      if (this.hasHouseRule("two-card-monte") && this.dealerHand.length > 2) {
        this.dealerHand.shift();
      }
      drawsRemaining -= 1;
    }
  }

  private currentPlayerBlackjack(): boolean {
    return isArcadeBlackjack(
      this.playerHand,
      this.playerValue(),
      this.scoringRules(),
      this.hasTrinket("gameshark")
    );
  }

  private currentDealerBlackjack(): boolean {
    return isArcadeBlackjack(
      this.dealerHand,
      this.dealerValue(),
      this.scoringRules(),
      false
    );
  }

  private resolveCurrentOutcome(): HandOutcome {
    if (this.forcedOutcome) return this.forcedOutcome;
    return resolveArcadeOutcome({
      playerValue: this.playerValue(),
      dealerValue: this.dealerValue(),
      playerBlackjack: this.currentPlayerBlackjack(),
      dealerBlackjack: this.currentDealerBlackjack(),
      golfScoring: this.hasTrinket("golf-scoring-card")
    });
  }

  private positiveProfitMultiplier(): number {
    let recordBonus = false;
    if (this.hasTrinket("record")) {
      const hasFaceCard = this.playerHand.some(({ rank }) => rank === "J" || rank === "Q" || rank === "K");
      if ((this.recordMode === "face" && hasFaceCard) || (this.recordMode === "no-face" && !hasFaceCard)) {
        recordBonus = true;
      }
    }
    return calculateProfitMultiplier({
      punchCardHits: this.hasTrinket("punch-card") ? this.hitCount : 0,
      followedMagic8BallCount: this.followedMagicAdviceCount,
      correctTradingPredictions: this.correctTradingPredictions,
      sunglasses: this.hasTrinket("sunglasses"),
      recordBonus,
      piggyBankSmash: !this.hasHouseRule("all-bets-are-off") && this.piggyChoice === "smash",
      bandAidUsed: this.bandAidUsed
    });
  }

  private async finishResolvedHand(): Promise<void> {
    if (this.phase === "settling" || this.phase === "selecting") return;
    this.phase = "settling";
    this.hideAllActionControls();
    this.timeCapsuleHitCard = null;

    const outcome = this.resolveCurrentOutcome();
    const payout = calculateArcadePayout({
      outcome,
      wager: this.activeWager,
      chipsStaked: this.activeStake,
      positiveProfitMultiplier: this.positiveProfitMultiplier(),
      lossRefundFraction:
        !this.hasHouseRule("all-bets-are-off") && this.piggyChoice === "save" ? 0.5 : 0
    });
    const resultMessage = `${this.handResolutionNote ? `${this.handResolutionNote} ` : ""}${this.describeOutcome(outcome)} ${this.rewardText(payout)}`;
    this.refreshHandCards(true, true);
    this.statusText.setText("SAVING HAND...");

    let balances: { chips: number; dunkaroos: number };
    try {
      ({ balances } = await settleCompletedHand({
        handId: this.activeHandId,
        wager: payout.wager,
        chipsStaked: payout.chipsStaked,
        chipsAwarded: payout.chipsAwarded,
        dunkaroosAwarded: payout.dunkaroosAwarded,
        outcome: payout.outcome
      }));
    } catch {
      if (!this.scene.isActive()) return;
      this.phase = "retry";
      this.statusText.setText("SAVE FAILED - PRESS RETRY");
      this.betButton.setText("RETRY");
      this.setButtonState(this.betButton, true, true);
      return;
    }
    if (!this.scene.isActive()) return;

    this.chips = balances.chips;
    this.dunkaroos = balances.dunkaroos;
    this.completedHands += 1;
    this.consecutiveLosses = outcome === "dealer-win" ? this.consecutiveLosses + 1 : 0;
    this.activeHandId = "";
    this.updateRegisteredUser();
    this.refreshBalances();
    this.statusText.setText(resultMessage);
    this.playOutcomeSound(outcome);

    const dialogue = selectDuncanCycleDialogue({
      completedHands: this.completedHands,
      outcome,
      lostFiveInARow: this.consecutiveLosses >= 5,
      bustedAfterHighHit: this.hitAtEighteenOrHigher && this.playerValue().busted
    });
    if (dialogue) await this.playDialogueScript(dialogue.script);
    if (!this.scene.isActive()) return;

    const aged = ageTrinketConveyor(this.trinkets);
    this.trinkets = aged.slots;
    const ruleAdvance = advanceHouseRuleAfterHand(
      this.houseRule,
      (expiredId) => chooseHouseRule(expiredId).id
    );
    if (ruleAdvance.changed) {
      await this.replaceHouseRule(ruleAdvance.houseRule);
      if (!this.scene.isActive()) return;
    } else {
      this.houseRule = ruleAdvance.houseRule;
      this.refreshHouseRule();
    }
    if (!this.hasTrinket("record")) this.recordMode = "face";
    this.conveyor.setSlots(this.trinkets, (id) => void this.useTrinket(id));

    this.phase = "selecting";
    const selected = await this.chooseTrinketOffer(offerTrinkets(this.trinkets));
    if (!selected || !this.scene.isActive()) return;
    this.trinkets = insertSelectedTrinket(this.trinkets, { id: selected.id });
    this.conveyor.setSlots(this.trinkets, (id) => void this.useTrinket(id));
    this.piggyChoice = null;
    this.enterBettingState(resultMessage);
  }

  private async useTrinket(id: TrinketId): Promise<void> {
    const definition = getTrinket(id);
    if (definition.interaction === "passive") {
      this.statusText.setText(`${definition.name}: ${definition.description}`);
      return;
    }
    this.audio.playEffect(GAME_SFX.menuClick.key);

    if (id === "piggy-bank") {
      if (this.phase === "betting") await this.choosePiggyMode();
      return;
    }
    if (this.phase !== "playing" || this.chickenActive) return;

    switch (id) {
      case "record":
        this.recordMode = this.recordMode === "face" ? "no-face" : "face";
        this.statusText.setText(`RECORD: ${this.recordMode === "face" ? "FACE-CARD" : "NO-FACE-CARD"} BONUS SIDE.`);
        break;
      case "trading-card":
        await this.useTradingCard();
        break;
      case "rubber-chicken":
        await this.startChickenGame();
        break;
      case "lucky-keychain":
        await this.useLuckyKeychain();
        break;
      case "time-capsule":
        await this.useTimeCapsule();
        break;
      case "dice":
        await this.useDice();
        break;
      case "magic-8-ball":
        this.useMagic8Ball();
        break;
      case "hall-pass":
        await this.useHallPass();
        break;
    }
  }

  private async choosePiggyMode(): Promise<void> {
    if (this.hasHouseRule("all-bets-are-off")) {
      this.statusText.setText("ALL BETS ARE OFF OVERRIDES THE PIGGY BANK.");
      return;
    }
    const options = [{ value: "save", label: "SAVE" }];
    if (this.chips >= 50) options.push({ value: "smash", label: "SMASH" });
    const selected = await this.askOptions("PIGGY BANK: CHOOSE BEFORE BETTING", options);
    if (selected !== "save" && selected !== "smash") return;
    this.piggyChoice = selected;
    this.selectedBet = selected === "save"
      ? Phaser.Math.Clamp(this.selectedBet, MINIMUM_BET, Math.min(20, this.chips))
      : Phaser.Math.Clamp(Math.max(50, this.selectedBet), 50, this.chips);
    this.enterBettingState(selected === "save" ? "SAVE: MAX 20, HALF REFUND ON LOSS." : "SMASH: MIN 50, DOUBLE WINNING PROFIT.");
  }

  private async useTradingCard(): Promise<void> {
    if (this.tradingPrediction || this.tradingComparison) {
      this.statusText.setText("TRADING CARD ALREADY HAS A PREDICTION LOCKED.");
      return;
    }
    const comparison = this.takeCard();
    this.tradingComparison = comparison;
    const selected = await this.askOptions(
      "WILL YOUR NEXT HIT BE HIGHER OR LOWER THAN THIS CARD?",
      [{ value: "higher", label: "HIGHER" }, { value: "lower", label: "LOWER" }],
      comparison
    );
    if (selected === "higher" || selected === "lower") {
      this.tradingPrediction = selected;
      this.statusText.setText(`TRADING CARD LOCKED: ${selected.toUpperCase()}.`);
    } else {
      this.tradingComparison = null;
    }
    this.restorePlayingControls();
  }

  private async startChickenGame(): Promise<void> {
    if (this.chickenActive) return;
    this.chickenActive = true;
    this.hideAllActionControls();
    this.statusText.setText("CHICKEN GAME: YOU HIT FIRST.");
    while (this.phase === "playing") {
      if (this.performPlayerHit()) break;
      await this.delay(450);
      if (this.phase !== "playing") break;
      this.dealerHand.push(this.takeCard());
      if (this.hasHouseRule("two-card-monte") && this.dealerHand.length > 2) this.dealerHand.shift();
      this.refreshHandCards(false);
      if (this.dealerValue().busted) {
        void this.finishResolvedHand();
        break;
      }
      await this.delay(450);
    }
  }

  private async useLuckyKeychain(): Promise<void> {
    if (this.luckyKeychainUsed) {
      this.statusText.setText("LUCKY KEYCHAIN WAS ALREADY USED THIS HAND.");
      return;
    }
    const eligible = this.visiblePlayerCardIndices().filter((index) => {
      const rank = this.playerHand[index]?.rank;
      return rank === "6" || rank === "9";
    });
    const index = await this.chooseCardIndex("CHANGE WHICH 6 OR 9?", eligible);
    if (index === null) return;
    const current = this.playerHand[index];
    if (!current || (current.rank !== "6" && current.rank !== "9")) return;
    this.playerHand[index] = { ...current, rank: current.rank === "6" ? "9" : "6" };
    this.luckyKeychainUsed = true;
    this.refreshHandCards(false);
    if (!this.handlePlayerTerminal()) this.restorePlayingControls();
  }

  private async useTimeCapsule(): Promise<void> {
    if (this.timeCapsuleUsed) {
      this.statusText.setText("TIME CAPSULE WAS ALREADY USED THIS HAND.");
      return;
    }
    const index = await this.chooseCardIndex("STORE WHICH CARD FOR NEXT HAND?", this.visiblePlayerCardIndices());
    if (index === null) return;
    const [stored] = this.playerHand.splice(index, 1);
    if (!stored) return;
    this.pendingTimeCapsuleCard = stored;
    this.timeCapsuleUsed = true;
    this.refreshHandCards(false);
    this.statusText.setText(`${this.cardLabel(stored)} STORED FOR NEXT HAND'S FIRST HIT.`);
    this.restorePlayingControls();
  }

  private async useDice(): Promise<void> {
    if (this.diceUsed) {
      this.statusText.setText("THE DICE WERE ALREADY USED THIS HAND.");
      return;
    }
    const rolls = [Phaser.Math.Between(1, 6), Phaser.Math.Between(1, 6)];
    const selected = await this.askOptions("CHOOSE A DIE", [
      { value: "0", label: String(rolls[0]) },
      { value: "1", label: String(rolls[1]) }
    ]);
    if (selected !== "0" && selected !== "1") return;
    const operation = await this.askOptions(`USE ${rolls[Number(selected)]}`, [
      { value: "add", label: "ADD" },
      { value: "subtract", label: "SUBTRACT" }
    ]);
    if (operation !== "add" && operation !== "subtract") return;
    const amount = rolls[Number(selected)] ?? 0;
    this.playerTotalAdjustment += operation === "add" ? amount : -amount;
    this.diceUsed = true;
    this.refreshHandCards(false);
    if (!this.handlePlayerTerminal()) this.restorePlayingControls();
  }

  private useMagic8Ball(): void {
    if (this.magicAdvice) {
      this.statusText.setText("THE MAGIC 8 BALL ALREADY SPOKE. HIT OR STAND FIRST.");
      return;
    }
    this.magicAdvice = Math.random() < 0.5 ? "hit" : "stand";
    this.statusText.setText(`MAGIC 8 BALL SAYS: ${this.magicAdvice.toUpperCase()}.`);
  }

  private resolveMagicAdvice(action: Advice): void {
    if (!this.magicAdvice) return;
    if (this.magicAdvice === action) this.followedMagicAdviceCount += 1;
    this.magicAdvice = null;
  }

  private async useHallPass(): Promise<void> {
    if (this.hallPassUsed) {
      this.statusText.setText("HALL PASS WAS ALREADY USED THIS HAND.");
      return;
    }
    const index = await this.chooseCardIndex("DISCARD WHICH CARD?", this.visiblePlayerCardIndices());
    if (index === null) return;
    const [discarded] = this.playerHand.splice(index, 1);
    if (!discarded) return;
    this.hallPassUsed = true;
    this.refreshHandCards(false);
    this.statusText.setText(`HALL PASS DISCARDED ${this.cardLabel(discarded)}.`);
    this.restorePlayingControls();
  }

  private visiblePlayerCardIndices(): number[] {
    return this.playerHand.flatMap((_, index) => index === this.hiddenPlayerCardIndex ? [] : [index]);
  }

  private async chooseTwoCards(cards: readonly Card[]): Promise<Card[] | null> {
    const indices = cards.map((_, index) => index);
    const first = await this.chooseCardIndex("BOOSTER PACK: KEEP YOUR FIRST CARD", indices);
    if (first === null) return null;
    const second = await this.chooseCardIndex("BOOSTER PACK: KEEP YOUR SECOND CARD", indices.filter((index) => index !== first));
    if (second === null) return null;
    return [cards[first] as Card, cards[second] as Card];
  }

  private chooseCardIndex(prompt: string, indices: readonly number[]): Promise<number | null> {
    if (indices.length === 0) {
      this.statusText.setText("NO ELIGIBLE CARD.");
      return Promise.resolve(null);
    }
    return this.askOptions(
      prompt,
      indices.map((index) => ({
        value: String(index),
        label: this.cardLabel(this.playerHand[index] as Card),
        fontFamily: GAME_NUMBER_FONT_FAMILY
      }))
    ).then((value) => value === null ? null : Number(value));
  }

  private askOptions(
    prompt: string,
    options: readonly { value: string; label: string; fontFamily?: string }[],
    comparisonCard?: Card
  ): Promise<string | null> {
    this.hideAllActionControls();
    this.clearModal();
    return new Promise((resolve) => {
      const panelY = comparisonCard ? 255 : 350;
      const panelHeight = comparisonCard ? 210 : 115;
      const panel = this.add.graphics().setDepth(300);
      panel.fillStyle(0x241b14, 0.98);
      panel.fillRoundedRect(255, panelY, 450, panelHeight, 12);
      panel.lineStyle(4, 0xe5c99b);
      panel.strokeRoundedRect(255, panelY, 450, panelHeight, 12);
      this.modalObjects.push(panel);

      const label = this.add
        .text(480, panelY + 18, prompt, {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: "14px",
          color: "#f6e8c8",
          align: "center",
          wordWrap: { width: 410 }
        })
        .setOrigin(0.5, 0)
        .setDepth(301);
      this.modalObjects.push(label);

      if (comparisonCard) {
        const card = this.add
          .image(480, panelY + 103, CARD_ASSETS.faces.key, cardFaceFrame(comparisonCard))
          .setDepth(301);
        const cardValue = this.add
          .text(530, panelY + 103, this.cardLabel(comparisonCard), {
            fontFamily: GAME_NUMBER_FONT_FAMILY,
            fontStyle: "bold",
            fontSize: "20px",
            color: "#f6e8c8"
          })
          .setOrigin(0, 0.5)
          .setDepth(301);
        this.modalObjects.push(card, cardValue);
      }

      const spacing = Math.min(125, 360 / Math.max(1, options.length));
      const startX = 480 - spacing * (options.length - 1) / 2;
      const finish = (value: string | null): void => {
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, cancel);
        this.clearModal();
        resolve(value);
      };
      const cancel = (): void => finish(null);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, cancel);

      options.forEach((option, index) => {
        const button = this.add
          .text(startX + spacing * index, comparisonCard ? panelY + 180 : 430, option.label, {
            fontFamily: option.fontFamily ?? GAME_FONT_FAMILY,
            fontStyle: option.fontFamily ? "bold" : "normal",
            fontSize: "14px",
            color: "#2a1b13",
            backgroundColor: "#e5c99b",
            padding: { x: 12, y: 8 }
          })
          .setOrigin(0.5)
          .setDepth(301)
          .setInteractive({ useHandCursor: true });
        button.on("pointerdown", () => {
          this.audio.playEffect(GAME_SFX.menuClick.key);
          finish(option.value);
        });
        this.modalObjects.push(button);
      });
    });
  }

  private chooseTrinketOffer(
    offers: readonly [TrinketDefinition, TrinketDefinition]
  ): Promise<TrinketDefinition | null> {
    this.clearModal();
    return new Promise((resolve) => {
      const panel = this.add.graphics().setDepth(300);
      panel.fillStyle(0x241b14, 0.98);
      panel.fillRoundedRect(180, 178, 138, 282, 12);
      panel.lineStyle(4, 0xe5c99b);
      panel.strokeRoundedRect(180, 178, 138, 282, 12);
      this.modalObjects.push(panel);
      const title = this.add
        .text(249, 194, "PICK A TRINKET", {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: "12px",
          color: "#f6e8c8"
        })
        .setOrigin(0.5)
        .setDepth(301);
      this.modalObjects.push(title);

      const tooltip = this.add
        .text(330, 245, "HOVER FOR DETAILS", {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: "12px",
          color: "#2a1b13",
          backgroundColor: "#f6e8c8",
          padding: { x: 8, y: 7 },
          wordWrap: { width: 235 }
        })
        .setDepth(302)
        .setVisible(false);
      this.modalObjects.push(tooltip);

      const finish = (value: TrinketDefinition | null): void => {
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, cancel);
        this.clearModal();
        resolve(value);
      };
      const cancel = (): void => finish(null);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, cancel);

      offers.forEach((offer, index) => {
        const y = 265 + index * 115;
        const icon = this.add
          .image(249, y, trinketTextureKey(offer.id))
          .setDisplaySize(TRINKET_ASSETS.trinket.displaySize, TRINKET_ASSETS.trinket.displaySize)
          .setDepth(301)
          .setInteractive({ useHandCursor: true });
        const name = this.add
          .text(249, y + 37, offer.name.toUpperCase(), {
            fontFamily: GAME_FONT_FAMILY,
            fontSize: "9px",
            color: "#f6e8c8",
            align: "center",
            wordWrap: { width: 120 }
          })
          .setOrigin(0.5, 0)
          .setDepth(301);
        icon.on("pointerover", () => tooltip.setText(`${offer.name.toUpperCase()}\n${offer.description}`).setVisible(true));
        icon.on("pointerout", () => tooltip.setVisible(false));
        icon.on("pointerdown", () => {
          this.audio.playEffect(GAME_SFX.menuClick.key);
          finish(offer);
        });
        this.modalObjects.push(icon, name);
      });
    });
  }

  private clearModal(): void {
    for (const object of this.modalObjects.splice(0)) object.destroy();
  }

  private restorePlayingControls(): void {
    if (this.phase === "playing" && !this.chickenActive) this.showPlayingControls();
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(milliseconds, resolve));
  }

  private cardLabel(card: Card): string {
    const suits: Record<Card["suit"], string> = {
      clubs: "C",
      diamonds: "D",
      hearts: "H",
      spades: "S"
    };
    return `${card.rank}${suits[card.suit]}`;
  }

  private async playDialogueScript(script: DuncanDialogueScript): Promise<void> {
    if (script.kind === "lines") {
      for (const line of script.lines) await this.dealer.speak(line);
      return;
    }
    if (script.kind === "yes-no") {
      for (const line of script.intro ?? []) await this.dealer.speak(line);
      const choice = await this.dealer.askYesNo(script.prompt);
      if (!choice) return;
      for (const line of choice === "yes" ? script.yes : script.no) await this.dealer.speak(line);
      return;
    }
    if (script.kind === "choice") {
      const selected = await this.dealer.askChoice(script.prompt, script.options.map(({ value, label }) => ({ value, label })));
      if (!selected) return;
      const response = script.options.find(({ value }) => value === selected)?.response;
      for (const line of response ?? []) await this.dealer.speak(line);
      return;
    }
    const answer = await this.dealer.askText(script.prompt);
    if (answer === null) return;
    const response = script.responses[answer.trim()] ?? script.otherwise;
    for (const line of response) await this.dealer.speak(line);
  }

  private updateRegisteredUser(): void {
    const user = this.registry.get("currentUser") as PublicUser;
    this.registry.set("currentUser", { ...user, chips: this.chips, dunkaroos: this.dunkaroos });
  }

  private describeOutcome(outcome: HandOutcome): string {
    if (outcome === "player-blackjack") return "Blackjack!";
    if (outcome === "player-win") return "You win!";
    if (outcome === "push") return "Push.";
    return this.playerValue().busted ? "You bust. The fox wins." : "Dealer wins.";
  }

  private rewardText(payout: ArcadePayout): string {
    if (payout.chipProfit > 0) return `+${payout.chipProfit} chips / +${payout.dunkaroosAwarded} dunkaroos.`;
    if (payout.outcome === "push") return "Your wager was returned.";
    if (payout.chipsStaked === 0) return "The free hand cost nothing.";
    if (payout.chipsAwarded > 0) return `${payout.chipsAwarded} chips refunded.`;
    return `You lost ${payout.chipsStaked} chips.`;
  }

  private playOutcomeSound(outcome: HandOutcome): void {
    if (outcome === "player-win" || outcome === "player-blackjack") this.audio.playEffect(GAME_SFX.coin.key);
    else if (outcome === "dealer-win") this.audio.playEffect(GAME_SFX.bust.key);
  }

  private enterBettingState(message: string): void {
    this.phase = "betting";
    this.activeWager = 0;
    this.activeStake = 0;
    this.statusText.setText(message);
    this.clearModal();
    this.setButtonState(this.hitButton, false, false);
    this.setButtonState(this.standButton, false, false);

    if (this.hasHouseRule("all-bets-are-off")) {
      this.piggyChoice = null;
      this.selectedBet = 10;
    }

    const minimum = this.minimumAvailableBet();
    const maximum = this.maximumAvailableBet();
    if (maximum >= minimum) this.selectedBet = Phaser.Math.Clamp(this.selectedBet, minimum, maximum);
    this.refreshBetControls();

    if (this.hasTrinket("piggy-bank") && !this.piggyChoice && !this.hasHouseRule("all-bets-are-off")) {
      this.statusText.setText("PIGGY BANK: CLICK IT OR PRESS BET TO CHOOSE SAVE OR SMASH.");
    }
  }

  private showPlayingControls(): void {
    for (const button of [this.decreaseBetButton, this.betButton, this.increaseBetButton]) this.setButtonState(button, false, false);
    this.setButtonState(this.hitButton, true, true);
    this.setButtonState(this.standButton, true, true);
    this.betText.setText(`BET: ${this.activeWager} CHIPS${this.activeStake === 0 ? " (FREE)" : ""}`);
  }

  private hideAllActionControls(): void {
    for (const button of [this.hitButton, this.standButton, this.decreaseBetButton, this.betButton, this.increaseBetButton]) {
      this.setButtonState(button, false, false);
    }
  }

  private refreshBetControls(): void {
    const minimum = this.minimumAvailableBet();
    const maximum = this.maximumAvailableBet();
    const awaitingPiggy = this.hasTrinket("piggy-bank") && !this.piggyChoice && !this.hasHouseRule("all-bets-are-off");
    const canBet = !awaitingPiggy && maximum >= minimum;

    if (this.hasHouseRule("all-bets-are-off")) {
      this.betText.setText("HOUSE RULE: FREE 10-CHIP HAND");
      this.betButton.setText("PLAY FREE 10");
    } else {
      this.betText.setText(`BET: ${this.selectedBet} CHIPS${this.piggyChoice ? ` / ${this.piggyChoice.toUpperCase()}` : ""}`);
      this.betButton.setText(awaitingPiggy ? "CHOOSE PIGGY" : `BET ${this.selectedBet}`);
    }
    this.setButtonState(this.decreaseBetButton, true, canBet && this.selectedBet > minimum && !this.hasHouseRule("all-bets-are-off"));
    this.setButtonState(this.betButton, true, awaitingPiggy || canBet);
    this.setButtonState(this.increaseBetButton, true, canBet && this.selectedBet < maximum && !this.hasHouseRule("all-bets-are-off"));
  }

  private setButtonState(button: Phaser.GameObjects.Text, visible: boolean, enabled: boolean): void {
    button.setVisible(visible).setAlpha(enabled ? 1 : 0.45);
    if (visible && enabled) button.setInteractive({ useHandCursor: true });
    else button.disableInteractive();
  }

  private refreshBalances(): void {
    this.balancesText.setText(`${this.chips}\n${this.dunkaroos}`);
  }

  private refreshHandCards(showDealerHoleCard: boolean, revealPlayer = false): void {
    for (const card of this.renderedCards) card.destroy();
    this.renderedCards = [];
    this.renderHand(this.dealerHand, 337, (index) => {
      if (showDealerHoleCard) return false;
      return this.hasHouseRule("no-peeking") ? index < 2 : index === 1;
    });
    this.renderHand(this.playerHand, 426, (index) => !revealPlayer && index === this.hiddenPlayerCardIndex);

    this.dealerTotalText.setText(showDealerHoleCard ? String(this.dealerValue().total) : "?");
    this.playerTotalText.setText(!revealPlayer && this.hiddenPlayerCardIndex !== null ? "?" : String(this.playerValue().total));
  }

  private renderHand(cards: readonly Card[], y: number, hidden: (index: number) => boolean): void {
    if (cards.length === 0) return;
    const spacing = cards.length > 1 ? Math.min(46, (460 - CARD_WIDTH) / (cards.length - 1)) : 0;
    const handWidth = CARD_WIDTH + spacing * (cards.length - 1);
    const firstX = 480 - handWidth / 2 + CARD_WIDTH / 2;
    cards.forEach((card, index) => {
      const image = hidden(index)
        ? this.add.image(firstX + index * spacing, y, CARD_ASSETS.backs.key, CARD_ASSETS.backs.frames.red)
        : this.add.image(firstX + index * spacing, y, CARD_ASSETS.faces.key, cardFaceFrame(card));
      this.renderedCards.push(image);
    });
  }
}
