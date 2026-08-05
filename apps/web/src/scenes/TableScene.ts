import Phaser from "phaser";
import {
  blackjackProfit,
  calculateHandValue,
  createDeck,
  drawCard,
  isBlackjack,
  shuffleDeck,
  type Card
} from "@fox-blackjack/game-core";
import { Dealer } from "../objects/Dealer";

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

  // Local visual prototype only: 100 starting chips + first daily login grant.
  private chips = 200;
  private dunkaroos = 0;
  private roundFinished = true;

  constructor() {
    super("TableScene");
  }

  create(): void {
    this.drawRoom();
    this.dealer = new Dealer(this, 480, 275);

    this.statusText = this.add
      .text(480, 318, "", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#f6e8c8"
      })
      .setOrigin(0.5);

    this.handText = this.add
      .text(480, 395, "", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ffffff",
        align: "center"
      })
      .setOrigin(0.5);

    this.balancesText = this.add
      .text(925, 28, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#f7d56b",
        align: "right"
      })
      .setOrigin(1, 0);

    this.hitButton = this.createButton(375, 485, "HIT", () => this.hit());
    this.standButton = this.createButton(585, 485, "STAND", () => this.stand());

    this.input.keyboard?.on("keydown-H", () => this.hit());
    this.input.keyboard?.on("keydown-S", () => this.stand());
    this.input.keyboard?.on("keydown-N", () => this.startRound());

    this.refreshBalances();
    this.startRound();
  }

  private drawRoom(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x261a30);
    graphics.fillRect(0, 0, 960, 300);
    graphics.fillStyle(0x3c1e32);
    graphics.fillRect(0, 0, 960, 78);
    graphics.fillStyle(0xd3a03c);
    graphics.fillRect(0, 76, 960, 5);
    graphics.fillStyle(0x0e5a47);
    graphics.fillRoundedRect(90, 265, 780, 275, 140);
    graphics.lineStyle(12, 0x5d321f);
    graphics.strokeRoundedRect(90, 265, 780, 275, 140);
    graphics.fillStyle(0x071c16, 0.35);
    graphics.fillEllipse(480, 395, 500, 170);

    this.add
      .text(28, 28, "DEAL ME IN, DUNC", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#f6e8c8"
      })
      .setOrigin(0, 0.5);

    this.add
      .text(28, 55, `BET: ${WAGER} CHIPS`, {
        fontFamily: "monospace",
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
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#f6e8c8",
        backgroundColor: "#702d47",
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
    if (!this.roundFinished) return;
    if (this.chips < WAGER) {
      this.statusText.setText("Not enough chips to play. Come back after a reward.");
      this.setButtonsEnabled(false);
      return;
    }

    this.chips -= WAGER;
    this.refreshBalances();
    this.deck = shuffleDeck(createDeck());
    this.playerHand = [drawCard(this.deck), drawCard(this.deck)];
    this.dealerHand = [drawCard(this.deck), drawCard(this.deck)];
    this.roundFinished = false;

    this.statusText.setText("H = hit  •  S = stand");
    this.setButtonsEnabled(true);
    this.refreshHandText(false);

    if (isBlackjack(this.playerHand) || isBlackjack(this.dealerHand)) {
      this.resolveInitialBlackjacks();
    }
  }

  private resolveInitialBlackjacks(): void {
    const playerBlackjack = isBlackjack(this.playerHand);
    const dealerBlackjack = isBlackjack(this.dealerHand);

    if (playerBlackjack && dealerBlackjack) {
      this.finishRound("Push: both have blackjack.", WAGER, 0, "A dramatic tie.");
    } else if (playerBlackjack) {
      const profit = blackjackProfit(WAGER);
      this.finishRound("Blackjack!", WAGER + profit, profit, "Now that's style.");
    } else {
      this.finishRound("Dealer blackjack.", 0, 0, "The cards have spoken.");
    }
  }

  private hit(): void {
    if (this.roundFinished) return;
    this.playerHand.push(drawCard(this.deck));

    if (calculateHandValue(this.playerHand) > 21) {
      this.finishRound("You bust. The fox wins.", 0, 0, "A bold choice.");
      return;
    }

    this.refreshHandText(false);
  }

  private stand(): void {
    if (this.roundFinished) return;

    while (calculateHandValue(this.dealerHand) < 17) {
      this.dealerHand.push(drawCard(this.deck));
    }

    const player = calculateHandValue(this.playerHand);
    const dealer = calculateHandValue(this.dealerHand);

    if (dealer > 21 || player > dealer) {
      this.finishRound("You win!", WAGER * 2, WAGER, "Well played.");
    } else if (player === dealer) {
      this.finishRound("Push.", WAGER, 0, "A civilized tie.");
    } else {
      this.finishRound("Dealer wins.", 0, 0, "House manners.");
    }
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
    const playerCards = this.playerHand.map((card) => `${card.rank}${card.suit}`).join("  ");
    const dealerCards = showDealerHoleCard
      ? this.dealerHand.map((card) => `${card.rank}${card.suit}`).join("  ")
      : `${this.dealerHand[0]?.rank}${this.dealerHand[0]?.suit}  ??`;

    const dealerTotal = showDealerHoleCard
      ? ` (${calculateHandValue(this.dealerHand)})`
      : "";

    this.handText.setText(
      `Dealer: ${dealerCards}${dealerTotal}\n\nYou: ${playerCards} (${calculateHandValue(this.playerHand)})`
    );
  }

  private setButtonsEnabled(enabled: boolean): void {
    for (const button of [this.hitButton, this.standButton]) {
      button.setAlpha(enabled ? 1 : 0.45);
      if (enabled) button.setInteractive({ useHandCursor: true });
      else button.disableInteractive();
    }
  }
}
