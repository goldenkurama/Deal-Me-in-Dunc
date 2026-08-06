import Phaser from "phaser";
import type { PublicUser } from "@fox-blackjack/shared-types";
import {
  calculateHandValue,
  createDeck,
  dealOpeningHands,
  drawCard,
  isNaturalBlackjack,
  playDealerHand,
  resolveHand,
  shuffleDeck,
  type Card,
  type HandResolution
} from "@fox-blackjack/game-core";
import { Dealer } from "../objects/Dealer";
import { TrinketConveyor } from "../objects/TrinketConveyor";
import { GAME_FONT_FAMILY } from "../config/typography";

const MINIMUM_BET = 10;
const BET_INCREMENT = 10;

export class TableScene extends Phaser.Scene {
  private dealer!: Dealer;
  private deck: Card[] = [];
  private playerHand: Card[] = [];
  private dealerHand: Card[] = [];

  private statusText!: Phaser.GameObjects.Text;
  private handText!: Phaser.GameObjects.Text;
  private balancesText!: Phaser.GameObjects.Text;
  private betText!: Phaser.GameObjects.Text;
  private hitButton!: Phaser.GameObjects.Text;
  private standButton!: Phaser.GameObjects.Text;
  private decreaseBetButton!: Phaser.GameObjects.Text;
  private betButton!: Phaser.GameObjects.Text;
  private increaseBetButton!: Phaser.GameObjects.Text;
  private dealButton!: Phaser.GameObjects.Text;

  // Hand results remain local until the transactional game API is implemented.
  private chips = 100;
  private dunkaroos = 0;
  private selectedBet = MINIMUM_BET;
  private activeWager = 0;
  private roundFinished = true;

  constructor() {
    super("TableScene");
  }

  create(): void {
    const user = this.registry.get("currentUser") as PublicUser;
    this.chips = user.chips;
    this.dunkaroos = user.dunkaroos;

    this.drawRoom();
    this.dealer = new Dealer(this, 480, 300).fitInside(320, 250);
    new TrinketConveyor(this, 16, 170);

    this.statusText = this.add
      .text(480, 332, "", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "18px",
        color: "#f6e8c8",
        align: "center"
      })
      .setOrigin(0.5);

    this.handText = this.add
      .text(480, 405, "", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "22px",
        color: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5);

    this.balancesText = this.add
      .text(925, 28, "", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "18px",
        color: "#f7d56b",
        align: "right"
      })
      .setOrigin(1, 0);

    this.hitButton = this.createButton(375, 495, "HIT", () => this.hit());
    this.standButton = this.createButton(585, 495, "STAND", () => this.stand());

    this.decreaseBetButton = this.createButton(245, 495, "-10", () =>
      this.adjustBet(-BET_INCREMENT)
    ).setFontSize(18).setPadding(14, 9);

    this.betButton = this.createButton(375, 495, "", () => this.cycleBet())
      .setFontSize(18)
      .setPadding(20, 9);

    this.increaseBetButton = this.createButton(505, 495, "+10", () =>
      this.adjustBet(BET_INCREMENT)
    ).setFontSize(18).setPadding(14, 9);

    this.dealButton = this.createButton(640, 495, "DEAL", () => this.startRound())
      .setFontSize(20)
      .setPadding(20, 9);

    this.createButton(805, 495, "LOBBY", () => this.scene.start("LobbyScene"))
      .setFontSize(17)
      .setPadding(15, 9);

    this.input.keyboard?.on("keydown-H", () => this.hit());
    this.input.keyboard?.on("keydown-S", () => this.stand());
    this.input.keyboard?.on("keydown-N", () => this.startRound());
    this.input.keyboard?.on("keydown-B", () => this.cycleBet());
    this.input.keyboard?.on("keydown-LEFT", () => this.adjustBet(-BET_INCREMENT));
    this.input.keyboard?.on("keydown-RIGHT", () => this.adjustBet(BET_INCREMENT));

    this.refreshBalances();
    this.enterBettingState("Choose your bet, then deal.");
  }

  private drawRoom(): void {
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

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
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

    button.on("pointerdown", onClick);
    button.on("pointerover", () => button.setScale(1.04));
    button.on("pointerout", () => button.setScale(1));

    return button;
  }

  private maximumAvailableBet(): number {
    return this.chips;
  }

  private adjustBet(change: number): void {
    if (!this.roundFinished || this.chips < MINIMUM_BET) return;

    const maximumBet = this.maximumAvailableBet();
    this.selectedBet = Phaser.Math.Clamp(
      this.selectedBet + change,
      MINIMUM_BET,
      maximumBet
    );
    this.refreshBetControls();
  }

  private cycleBet(): void {
    if (!this.roundFinished || this.chips < MINIMUM_BET) return;

    const maximumBet = this.maximumAvailableBet();
    this.selectedBet =
      this.selectedBet >= maximumBet
        ? MINIMUM_BET
        : Math.min(this.selectedBet + BET_INCREMENT, maximumBet);
    this.refreshBetControls();
  }

  private startRound(): void {
    if (!this.roundFinished) return;

    const maximumBet = this.maximumAvailableBet();
    if (maximumBet < MINIMUM_BET) {
      this.enterBettingState("Not enough chips to place the minimum bet.");
      return;
    }

    this.selectedBet = Math.min(this.selectedBet, maximumBet);
    this.activeWager = this.selectedBet;
    this.chips -= this.activeWager;
    this.roundFinished = false;
    this.refreshBalances();
    this.showPlayingControls();

    const shuffledDeck = shuffleDeck(createDeck());
    const openingDeal = dealOpeningHands(shuffledDeck);

    this.playerHand = openingDeal.playerHand;
    this.dealerHand = openingDeal.dealerHand;
    this.deck = openingDeal.remainingDeck;

    this.statusText.setText("H = HIT  /  S = STAND");
    this.refreshHandText(false);

    if (
      isNaturalBlackjack(this.playerHand) ||
      isNaturalBlackjack(this.dealerHand)
    ) {
      this.finishResolvedHand();
    }
  }

  private takeCard(): Card {
    const result = drawCard(this.deck);
    this.deck = result.remainingDeck;
    return result.card;
  }

  private hit(): void {
    if (this.roundFinished) return;

    this.playerHand.push(this.takeCard());

    if (calculateHandValue(this.playerHand).busted) {
      this.finishResolvedHand();
      return;
    }

    this.refreshHandText(false);
  }

  private stand(): void {
    if (this.roundFinished) return;

    const dealerPlay = playDealerHand(this.dealerHand, this.deck);
    this.dealerHand = dealerPlay.dealerHand;
    this.deck = dealerPlay.remainingDeck;
    this.finishResolvedHand();
  }

  private finishResolvedHand(): void {
    const resolution = resolveHand(
      this.playerHand,
      this.dealerHand,
      this.activeWager
    );
    const presentation = this.describeResolution(resolution);

    this.roundFinished = true;
    this.chips += resolution.chipsReturned;
    this.dunkaroos += resolution.dunkaroosAwarded;
    this.refreshBalances();
    this.refreshHandText(true);
    this.enterBettingState(`${presentation.message} ${this.rewardText(resolution)}`);

    void this.dealer.react(presentation.reaction);
  }

  private describeResolution(resolution: HandResolution): {
    message: string;
    reaction: string;
  } {
    switch (resolution.outcome) {
      case "player-blackjack":
        return { message: "Blackjack!", reaction: "Now that's style." };
      case "player-win":
        return { message: "You win!", reaction: "Well played." };
      case "push":
        return { message: "Push.", reaction: "A civilized tie." };
      case "dealer-win":
        return calculateHandValue(this.playerHand).busted
          ? { message: "You bust. The fox wins.", reaction: "A bold choice." }
          : { message: "Dealer wins.", reaction: "The cards have spoken." };
    }
  }

  private rewardText(resolution: HandResolution): string {
    if (resolution.chipProfit > 0) {
      return `+${resolution.chipProfit} chips / +${resolution.dunkaroosAwarded} dunkaroos.`;
    }
    if (resolution.outcome === "push") return "Your wager was returned.";
    return `You lost ${resolution.wager} chips.`;
  }

  private enterBettingState(message: string): void {
    this.activeWager = 0;
    this.statusText.setText(message);

    const maximumBet = this.maximumAvailableBet();
    if (maximumBet >= MINIMUM_BET) {
      this.selectedBet = Phaser.Math.Clamp(
        this.selectedBet,
        MINIMUM_BET,
        maximumBet
      );
    }

    this.setButtonState(this.hitButton, false, false);
    this.setButtonState(this.standButton, false, false);
    this.refreshBetControls();
  }

  private showPlayingControls(): void {
    for (const button of [
      this.decreaseBetButton,
      this.betButton,
      this.increaseBetButton,
      this.dealButton
    ]) {
      this.setButtonState(button, false, false);
    }

    this.setButtonState(this.hitButton, true, true);
    this.setButtonState(this.standButton, true, true);
    this.betText.setText(`BET: ${this.activeWager} CHIPS`);
  }

  private refreshBetControls(): void {
    const maximumBet = this.maximumAvailableBet();
    const canBet = maximumBet >= MINIMUM_BET;

    this.betText.setText(`BET: ${this.selectedBet} CHIPS`);
    this.betButton.setText(`BET ${this.selectedBet}`);
    this.setButtonState(
      this.decreaseBetButton,
      true,
      canBet && this.selectedBet > MINIMUM_BET
    );
    this.setButtonState(this.betButton, true, canBet);
    this.setButtonState(
      this.increaseBetButton,
      true,
      canBet && this.selectedBet < maximumBet
    );
    this.setButtonState(this.dealButton, true, canBet);
  }

  private setButtonState(
    button: Phaser.GameObjects.Text,
    visible: boolean,
    enabled: boolean
  ): void {
    button.setVisible(visible).setAlpha(enabled ? 1 : 0.45);

    if (visible && enabled) {
      button.setInteractive({ useHandCursor: true });
    } else {
      button.disableInteractive();
    }
  }

  private refreshBalances(): void {
    this.balancesText.setText(
      `chips: ${this.chips}\ndunkaroos: ${this.dunkaroos}`
    );
  }

  private refreshHandText(showDealerHoleCard: boolean): void {
    const playerCards = this.playerHand
      .map((card) => `${card.rank}${card.suit}`)
      .join("  ");

    const dealerCards = showDealerHoleCard
      ? this.dealerHand
          .map((card) => `${card.rank}${card.suit}`)
          .join("  ")
      : `${this.dealerHand[0]?.rank}${this.dealerHand[0]?.suit}  ??`;

    const dealerTotal = showDealerHoleCard
      ? ` (${calculateHandValue(this.dealerHand).total})`
      : "";

    const playerTotal = calculateHandValue(this.playerHand).total;

    this.handText.setText(
      `Dealer: ${dealerCards}${dealerTotal}\n\n` +
        `You: ${playerCards} (${playerTotal})`
    );
  }
}
