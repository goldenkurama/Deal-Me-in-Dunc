import Phaser from "phaser";
import { GAME_FONT_FAMILY } from "../config/typography";

export class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }

  create(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x241b14);
    graphics.fillRect(0, 0, 960, 540);
    graphics.fillStyle(0xe5c99b);
    graphics.fillRoundedRect(120, 69, 720, 402, 18);
    graphics.lineStyle(10, 0x5b3b28);
    graphics.strokeRoundedRect(120, 69, 720, 402, 18);
    graphics.lineStyle(3, 0xb88d59);
    graphics.strokeRoundedRect(136, 85, 688, 370, 12);

    this.add
      .text(480, 129, "DUNC'S BACK-ROOM SHOP", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "34px",
        fontStyle: "bold",
        color: "#2a1b13"
      })
      .setOrigin(0.5);

    this.add
      .text(480, 258, "Inventory will live here.\nCustom cosmetics plug into the asset manifests.", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "20px",
        color: "#62452e",
        align: "center",
        lineSpacing: 12
      })
      .setOrigin(0.5);

    const back = this.add
      .text(480, 405, "BACK TO TABLE", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
        color: "#f4e3bf",
        backgroundColor: "#345b42",
        padding: { x: 22, y: 11 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    back.on("pointerdown", () => this.scene.start("LobbyScene"));
  }
}
