import Phaser from "phaser";
import type { PublicUser } from "@fox-blackjack/shared-types";
import { DEALER_ASSETS, SCENE_ASSETS } from "../assets";
import { GAME_FONT_FAMILY } from "../config/typography";
import { Dealer } from "../objects/Dealer";

const COLORS = {
  room: 0x241b14,
  wall: 0x33271d,
  wood: 0x4b3020,
  felt: 0x234c35,
  feltDark: 0x173425,
  tan: 0xe5c99b,
  brown: 0x5b3b28,
  ink: 0x2a1b13,
  gold: 0xb88a45
} as const;

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super("LobbyScene");
  }

  create(): void {
    const user = this.registry.get("currentUser") as PublicUser;
    this.addRoom();
    this.drawHeader(user);
    this.addTable();
    this.addDealerPlaceholder();

    this.createButton(480, 425, "PLAY", () => this.scene.start("TableScene"), true);
  }

  private drawRoom(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.room);
    graphics.fillRect(0, 0, 960, 540);
    graphics.fillStyle(COLORS.wall);
    graphics.fillRect(24, 21, 912, 307);
    graphics.lineStyle(8, COLORS.wood);
    graphics.strokeRect(24, 21, 912, 307);

    // Quiet placeholder details until the 960 x 540 background is imported.
    graphics.fillStyle(0x16110d, 0.45);
    graphics.fillRect(54, 84, 185, 165);
    graphics.fillRect(721, 84, 185, 165);
    graphics.lineStyle(3, COLORS.gold, 0.35);
    graphics.strokeRect(66, 96, 161, 141);
    graphics.strokeRect(733, 96, 161, 141);
  }

  private addRoom(): void {
    if (this.textures.exists(SCENE_ASSETS.room.key)) {
      this.add
        .image(0, 0, SCENE_ASSETS.room.key)
        .setOrigin(0)
        .setDisplaySize(SCENE_ASSETS.room.width, SCENE_ASSETS.room.height);
      return;
    }
    this.drawRoom();
  }

  private drawHeader(user: PublicUser): void {
    this.add.text(46, 40, "DEAL ME IN, DUNC", {
      fontFamily: GAME_FONT_FAMILY,
      fontSize: "25px",
      fontStyle: "bold",
      color: "#ead6ae"
    });

    this.add
      .text(914, 38, `${user.username.toUpperCase()}\n${user.chips} CHIPS  ·  ${user.dunkaroos} DUNKAROOS`, {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "15px",
        color: "#d3b77f",
        align: "right",
        lineSpacing: 7
      })
      .setOrigin(1, 0);
  }

  private addDealerPlaceholder(): void {
    const { width, height } = DEALER_ASSETS.displayArea;
    const areaX = 480;
    const areaBottom = 320;
    const dealer = new Dealer(this, areaX, areaBottom);

    // The final animation may use transparent padding; it will always fit this box.
    dealer.fitInside(width, height);

    this.add
      .text(areaX, 58, "320 × 250 DUNCAN ANIMATION AREA", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "12px",
        color: "#a98a61"
      })
      .setOrigin(0.5);
  }

  private drawTable(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.wood);
    graphics.fillRoundedRect(26, 292, 908, 315, 142);
    graphics.fillStyle(COLORS.felt);
    graphics.fillRoundedRect(39, 300, 882, 293, 135);
    graphics.lineStyle(4, COLORS.feltDark, 0.8);
    graphics.strokeRoundedRect(54, 318, 852, 258, 120);

    this.add
      .text(480, 365, "THE TABLE IS OPEN", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "18px",
        color: "#bca56f"
      })
      .setOrigin(0.5);
  }

  private addTable(): void {
    if (this.textures.exists(SCENE_ASSETS.table.key)) {
      this.add
        .image(0, 0, SCENE_ASSETS.table.key)
        .setOrigin(0)
        .setDisplaySize(SCENE_ASSETS.table.width, SCENE_ASSETS.table.height);
      return;
    }
    this.drawTable();
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    primary = false
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: primary ? "25px" : "16px",
        fontStyle: "bold",
        color: primary ? "#2a1b13" : "#ead6ae",
        backgroundColor: primary ? "#e5c99b" : "#5b3b28",
        padding: primary ? { x: 34, y: 13 } : { x: 18, y: 9 },
        stroke: primary ? "#9c7443" : "#2a1b13",
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", onClick);
    button.on("pointerover", () => button.setTint(0xfff1cf));
    button.on("pointerout", () => button.clearTint());
    return button;
  }
}
