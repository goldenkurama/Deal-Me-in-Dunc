import Phaser from "phaser";
import { DEALER_ASSETS } from "../assets";
import { GAME_FONT_FAMILY } from "../config/typography";

export class Dealer extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, DEALER_ASSETS.idle.key, 0);

    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setScale(2);
    this.play("dealer-idle");
  }

  playIdle(): void {
    this.play("dealer-idle", true);
  }

  fitInside(width: number, height: number): this {
    this.setScale(Math.min(width / this.width, height / this.height));
    return this;
  }

  async react(message: string): Promise<void> {
    const speech = this.scene.add
      .text(this.x + 90, this.y - 170, message, {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "18px",
        color: "#2a1738",
        backgroundColor: "#f6e8c8",
        padding: { x: 10, y: 7 }
      })
      .setOrigin(0, 1);

    await new Promise<void>((resolve) => {
      this.scene.time.delayedCall(1100, () => {
        speech.destroy();
        resolve();
      });
    });
  }
}
