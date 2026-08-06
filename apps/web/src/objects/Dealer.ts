import Phaser from "phaser";
import {
  DEALER_ASSETS,
  DEALER_IDLE_VARIATIONS,
  DUNCAN_VOICE_ASSETS,
  type DealerIdleVariationName
} from "../assets";
import { GAME_FONT_FAMILY } from "../config/typography";

export class Dealer extends Phaser.GameObjects.Sprite {
  private idleVariationTimer: Phaser.Time.TimerEvent | null = null;
  private lastIdleVariation: DealerIdleVariationName | null = null;
  private activeDialogueClose: (() => void) | null = null;

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

  speak(message: string): Promise<void> {
    this.activeDialogueClose?.();

    return new Promise<void>((resolve) => {
      const blocker = this.scene.add
        .rectangle(0, 0, 960, 540, 0x000000, 0.001)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });
      const panel = this.scene.add.graphics();
      panel.fillStyle(0x2a1b13, 0.96);
      panel.fillRoundedRect(78, 362, 804, 164, 9);
      panel.fillStyle(0xe5c99b, 1);
      panel.fillRoundedRect(84, 368, 792, 152, 6);
      panel.lineStyle(3, 0x8d6840, 1);
      panel.strokeRoundedRect(92, 376, 776, 136, 4);

      const speaker = this.scene.add.text(112, 382, "DUNCAN", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "17px",
        color: "#f6e8c8",
        backgroundColor: "#5b3b28",
        padding: { x: 10, y: 4 }
      });
      const speech = this.scene.add.text(114, 419, "", {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: "21px",
        color: "#2a1b13",
        wordWrap: { width: 720, useAdvancedWrap: true },
        lineSpacing: 5
      });
      const continueText = this.scene.add
        .text(842, 493, "CLICK / ENTER  ▼", {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: "13px",
          color: "#5b3b28"
        })
        .setOrigin(1, 0);
      continueText.setVisible(false);

      const dialogue = this.scene.add
        .container(0, 0, [blocker, panel, speaker, speech, continueText])
        .setDepth(2000);

      let characterIndex = 0;
      let spokenCharacters = 0;
      let fullyRevealed = false;
      let closed = false;
      let revealTimer: Phaser.Time.TimerEvent | null = null;

      const revealAll = (): void => {
        revealTimer?.remove(false);
        revealTimer = null;
        speech.setText(message);
        fullyRevealed = true;
        continueText.setVisible(true);
      };

      const close = (): void => {
        if (closed) return;
        closed = true;
        revealTimer?.remove(false);
        blocker.off("pointerdown", advance);
        this.scene.input.keyboard?.off("keydown-SPACE", advance);
        this.scene.input.keyboard?.off("keydown-ENTER", advance);
        this.scene.input.keyboard?.off("keydown-E", advance);
        this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, close);
        dialogue.destroy(true);
        if (this.activeDialogueClose === close) this.activeDialogueClose = null;
        resolve();
      };

      const advance = (): void => {
        if (fullyRevealed) {
          close();
        } else {
          revealAll();
        }
      };

      this.activeDialogueClose = close;
      blocker.on("pointerdown", advance);
      this.scene.input.keyboard?.on("keydown-SPACE", advance);
      this.scene.input.keyboard?.on("keydown-ENTER", advance);
      this.scene.input.keyboard?.on("keydown-E", advance);
      this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, close);

      revealTimer = this.scene.time.addEvent({
        delay: 34,
        loop: true,
        callback: () => {
          const character = message[characterIndex];
          if (character === undefined) {
            revealAll();
            return;
          }

          characterIndex += 1;
          speech.setText(message.slice(0, characterIndex));

          if (/\w/.test(character)) {
            spokenCharacters += 1;
            if (spokenCharacters % 3 === 1) this.playVoiceBlip();
          }
        }
      });
    });
  }

  private playVoiceBlip(): void {
    const voice = Phaser.Utils.Array.GetRandom([...DUNCAN_VOICE_ASSETS]);
    if (!voice || !this.scene.cache.audio.exists(voice.key)) return;

    this.scene.sound.play(voice.key, {
      volume: 0.38,
      rate: Phaser.Math.FloatBetween(0.96, 1.04)
    });
  }
}
