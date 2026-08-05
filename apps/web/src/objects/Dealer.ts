import Phaser from "phaser";
import {
  DEALER_ASSETS,
  DEALER_IDLE_VARIATIONS,
  type DealerIdleVariationName
} from "../assets";
import { GAME_FONT_FAMILY } from "../config/typography";

export class Dealer extends Phaser.GameObjects.Sprite {
  private idleVariationTimer: Phaser.Time.TimerEvent | null = null;
  private lastIdleVariation: DealerIdleVariationName | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, DEALER_ASSETS.animations.idle.key, 0);

    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.playIdle();
  }

  playIdle(): void {
    this.play(DEALER_ASSETS.animations.idle.animationKey, true);
    this.scheduleIdleVariation();
  }

  fitInside(width: number, height: number): this {
    this.setScale(Math.min(width / this.width, height / this.height));
    return this;
  }

  private scheduleIdleVariation(): void {
    this.idleVariationTimer?.remove(false);
    this.idleVariationTimer = this.scene.time.delayedCall(
      Phaser.Math.Between(4500, 9000),
      () => this.playRandomIdleVariation()
    );
  }

  private playRandomIdleVariation(): void {
    const available = DEALER_IDLE_VARIATIONS.filter(
      ({ name }) => name !== this.lastIdleVariation
    );
    const totalWeight = available.reduce((total, item) => total + item.weight, 0);
    let roll = Phaser.Math.Between(1, totalWeight);
    let selected = available[0];

    for (const candidate of available) {
      roll -= candidate.weight;
      if (roll <= 0) {
        selected = candidate;
        break;
      }
    }

    if (!selected) {
      this.playIdle();
      return;
    }

    this.lastIdleVariation = selected.name;
    const animation = DEALER_ASSETS.animations[selected.name];
    this.once(
      `${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}${animation.animationKey}`,
      () => this.playIdle()
    );
    this.play(animation.animationKey, true);
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
