import Phaser from "phaser";

export class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }

  create(): void {
    this.add
      .text(480, 250, "Shop scene placeholder", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#f6e8c8"
      })
      .setOrigin(0.5);
  }
}
