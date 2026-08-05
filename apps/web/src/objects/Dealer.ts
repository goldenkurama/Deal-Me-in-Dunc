import Phaser from "phaser";

export class Dealer extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "dealer-idle-sheet", 0);

    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setScale(2);
    this.play("dealer-idle");
  }

  playIdle(): void {
    this.play("dealer-idle", true);
  }

  async react(message: string): Promise<void> {
    const speech = this.scene.add
      .text(this.x + 90, this.y - 170, message, {
        fontFamily: "monospace",
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
