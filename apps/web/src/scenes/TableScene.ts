import Phaser from "phaser";
import type { PublicUser } from "@fox-blackjack/shared-types";
import {
  calculateHandValue,
  createDeck,
  dealOpeningHands,
  drawCard,
  isNaturalBlackjack,
  shuffleDeck,
  type Card
} from "@fox-blackjack/game-core";
import { Dealer } from "../objects/Dealer";
import { TrinketConveyor } from "../objects/TrinketConveyor";
import { GAME_FONT_FAMILY } from "../config/typography";

const WAGER = 10;

export class TableScene extends Phaser.Scene {
  private dealer!: Dealer;
  private deck: Card[] = [];
  private playerHand: Card[] = [];
  private dealerHand: Card[] = [];

  private statusText!: Phaser.GameObjects.Text;
  private handText!: Phaser.GameObjects.Text;
  private balancesText!: Phaser.GameObjects.Text;
  private hitButton!: Phaser.GameObjects.Text;
  private standButton!: Phaser.GameObjects.Text;

  // Hand results remain local until the transactional game API is implemented.
  private chips = 100;
  private dunkaroos = 0;
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
        fontSize: "20px",
        color: "#f6e8c8"
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
    this.createButton(750, 495, "LOBBY", () => this.scene.start("LobbyScene"))
      .setFontSize(17)
      .setPadding(15, 9);

    this.input.keyboard?.on("keydown-H", () => this.hit());
    this.input.keyboard?.on("keydown-S", () => this.stand());
    this.input.keyboard?.on("keydown-N", () => this.startRound());

    this.refreshBalances();
    this.startRound();
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

    this.add
      .text(28, 55, `BET: ${WAGER} CHIPS`, {
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

  private startRound(): void {
    if (!this.roundFinished) {
      return;
    }

    if (this.chips < WAGER) {
      this.statusText.setText(
        "Not enough chips to play. Come back after a reward."
      );
      this.setButtonsEnabled(false);
      return;
    }

    this.chips -= WAGER;
    this.refreshBalances();

    const shuffledDeck = shuffleDeck(createDeck());
    const openingDeal = dealOpeningHands(shuffledDeck);

    this.playerHand = openingDeal.playerHand;
    this.dealerHand = openingDeal.dealerHand;
    this.deck = openingDeal.remainingDeck;
    this.roundFinished = false;

    this.statusText.setText("H = hit  •  S = stand");
    this.setButtonsEnabled(true);
    this.refreshHandText(false);

    if (
      isNaturalBlackjack(this.playerHand) ||
      isNaturalBlackjack(this.dealerHand)
    ) {
      this.resolveInitialBlackjacks();
    }
  }

  private resolveInitialBlackjacks(): void {
    const playerBlackjack = isNaturalBlackjack(this.playerHand);
    const dealerBlackjack = isNaturalBlackjack(this.dealerHand);

    if (playerBlackjack && dealerBlackjack) {
      this.finishRound(
        "Push: both have blackjack.",
        WAGER,
        0,
        "A dramatic tie."
      );
      return;
    }

    if (playerBlackjack) {
      const profit = Math.ceil(WAGER * 1.5);
      this.finishRound(
        "Blackjack!",
        WAGER + profit,
        profit,
        "Now that's style."
      );
      return;
    }

    this.finishRound(
      "Dealer blackjack.",
      0,
      0,
      "The cards have spoken."
    );
  }

  private takeCard(): Card {
    const result = drawCard(this.deck);
    this.deck = result.remainingDeck;
    return result.card;
  }

  private hit(): void {
    if (this.roundFinished) {
      return;
    }

    this.playerHand.push(this.takeCard());

    if (calculateHandValue(this.playerHand).busted) {
      this.finishRound(
        "You bust. The fox wins.",
        0,
        0,
        "A bold choice."
      );
      return;
    }

    this.refreshHandText(false);
  }

  private stand(): void {
    if (this.roundFinished) {
      return;
    }

    while (calculateHandValue(this.dealerHand).total < 17) {
      this.dealerHand.push(this.takeCard());
    }

    const playerTotal = calculateHandValue(this.playerHand).total;
    const dealerValue = calculateHandValue(this.dealerHand);

    if (dealerValue.busted || playerTotal > dealerValue.total) {
      this.finishRound(
        "You win!",
        WAGER * 2,
        WAGER,
        "Well played."
      );
      return;
    }

    if (playerTotal === dealerValue.total) {
      this.finishRound(
        "Push.",
        WAGER,
        0,
        "A civilized tie."
      );
      return;
    }

    this.finishRound(
      "Dealer wins.",
      0,
      0,
      "House manners."
    );
  }

  private finishRound(
    message: string,
    chipsReturned: number,
    profitDunkaroos: number,
    reaction: string
  ): void {
    this.roundFinished = true;
    this.chips += chipsReturned;
    this.dunkaroos += profitDunkaroos;

    this.refreshBalances();
    this.statusText.setText(`${message} Press N for another round.`);
    this.setButtonsEnabled(false);
    this.refreshHandText(true);

    void this.dealer.react(reaction);
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

  private setButtonsEnabled(enabled: boolean): void {
    for (const button of [this.hitButton, this.standButton]) {
      button.setAlpha(enabled ? 1 : 0.45);

      if (enabled) {
        button.setInteractive({ useHandCursor: true });
      } else {
        button.disableInteractive();
      }
    }
  }
}
