import Phaser from "phaser";
import {
  DEALER_ASSETS,
  DEALER_IDLE_VARIATIONS,
  DUNCAN_VOICE_ASSETS,
  GAME_SFX,
  type DealerIdleVariationName
} from "../assets";
import { AudioManager } from "../audio/AudioManager";
import { GAME_FONT_FAMILY } from "../config/typography";

interface DialogueChoice {
  readonly value: string;
  readonly label: string;
}

type DialogueInteraction =
  | { readonly kind: "continue" }
  | { readonly kind: "choices"; readonly options: readonly DialogueChoice[] }
  | { readonly kind: "text" };

export class Dealer extends Phaser.GameObjects.Sprite {
  private idleVariationTimer: Phaser.Time.TimerEvent | null = null;
  private lastIdleVariation: DealerIdleVariationName | null = null;
  private activeDialogueClose: (() => void) | null = null;
  private readonly audio: AudioManager;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, DEALER_ASSETS.animations.idle.key, 0);

    scene.add.existing(this);
    this.audio = new AudioManager(scene);
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

  async speak(message: string): Promise<void> {
    await this.presentDialogue(message, { kind: "continue" });
  }

  async askYesNo(message: string): Promise<"yes" | "no" | null> {
    const choice = await this.askChoice(message, [
      { value: "yes", label: "YES" },
      { value: "no", label: "NO" }
    ]);
    return choice === "yes" || choice === "no" ? choice : null;
  }

  askChoice(
    message: string,
    options: readonly DialogueChoice[]
  ): Promise<string | null> {
    return this.presentDialogue(message, { kind: "choices", options });
  }

  askText(message: string): Promise<string | null> {
    return this.presentDialogue(message, { kind: "text" });
  }

  private presentDialogue(
    message: string,
    interaction: DialogueInteraction
  ): Promise<string | null> {
    this.activeDialogueClose?.();

    return new Promise<string | null>((resolve) => {
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
        .text(842, 493, "CLICK / ENTER  >", {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: "13px",
          color: "#5b3b28"
        })
        .setOrigin(1, 0);
      continueText.setVisible(false);

      const choiceStyle: Phaser.Types.GameObjects.Text.TextStyle = {
        fontFamily: GAME_FONT_FAMILY,
        fontSize:
          interaction.kind === "choices" && interaction.options.length > 2
            ? "13px"
            : "16px",
        color: "#f6e8c8",
        backgroundColor: "#5b3b28",
        padding: { x: 10, y: 6 }
      };
      const choiceObjects =
        interaction.kind === "choices"
          ? interaction.options.map((option, index) =>
              this.scene.add
                .text(
                  110 + (740 / interaction.options.length) * (index + 0.5),
                  482,
                  option.label,
                  choiceStyle
                )
                .setOrigin(0.5)
                .setVisible(false)
                .disableInteractive()
            )
          : [];

      const inputBackground = this.scene.add
        .rectangle(114, 462, 570, 38, 0xfff8e8)
        .setOrigin(0)
        .setStrokeStyle(3, 0x5b3b28)
        .setVisible(false);
      const inputText = this.scene.add
        .text(126, 470, "TYPE ANSWER…", {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: "17px",
          color: "#8d6840"
        })
        .setVisible(false);
      const submitChoice = this.scene.add
        .text(782, 481, "SUBMIT", choiceStyle)
        .setOrigin(0.5)
        .setVisible(false)
        .disableInteractive();

      const dialogue = this.scene.add
        .container(0, 0, [
          blocker,
          panel,
          speaker,
          speech,
          continueText,
          ...choiceObjects,
          inputBackground,
          inputText,
          submitChoice
        ])
        .setDepth(2000);

      let characterIndex = 0;
      let spokenCharacters = 0;
      let fullyRevealed = false;
      let closed = false;
      let typedValue = "";
      let revealTimer: Phaser.Time.TimerEvent | null = null;

      const revealAll = (): void => {
        revealTimer?.remove(false);
        revealTimer = null;
        speech.setText(message);
        fullyRevealed = true;
        if (interaction.kind === "choices") {
          for (const choice of choiceObjects) {
            choice.setVisible(true).setInteractive({ useHandCursor: true });
          }
        } else if (interaction.kind === "text") {
          inputBackground.setVisible(true);
          inputText.setVisible(true);
          submitChoice
            .setVisible(true)
            .setInteractive({ useHandCursor: true });
        } else {
          continueText.setVisible(true);
        }
      };

      const close = (result: string | null = null): void => {
        if (closed) return;
        closed = true;
        revealTimer?.remove(false);
        blocker.off("pointerdown", advance);
        choiceObjects.forEach((choice, index) => {
          choice.off("pointerdown", choiceHandlers[index]);
        });
        submitChoice.off("pointerdown", submitText);
        this.scene.input.keyboard?.off("keydown-SPACE", advance);
        this.scene.input.keyboard?.off("keydown-ENTER", advance);
        this.scene.input.keyboard?.off("keydown-E", advance);
        this.scene.input.keyboard?.off("keydown-Y", chooseYes);
        this.scene.input.keyboard?.off("keydown-N", chooseNo);
        this.scene.input.keyboard?.off("keydown", handleTextKey);
        this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, handleShutdown);
        dialogue.destroy(true);
        if (this.activeDialogueClose === closeActiveDialogue) {
          this.activeDialogueClose = null;
        }
        resolve(result);
      };

      const advance = (): void => {
        if (fullyRevealed && interaction.kind === "continue") {
          close();
        } else if (!fullyRevealed) {
          revealAll();
        }
      };

      const choose = (choice: string): void => {
        if (!fullyRevealed) {
          revealAll();
          return;
        }
        this.audio.playEffect(GAME_SFX.menuClick.key);
        close(choice);
      };
      const chooseYes = (): void => choose("yes");
      const chooseNo = (): void => choose("no");
      const choiceHandlers =
        interaction.kind === "choices"
          ? interaction.options.map(({ value }) => () => choose(value))
          : [];

      const refreshInputText = (): void => {
        inputText
          .setText(typedValue || "TYPE ANSWER…")
          .setColor(typedValue ? "#2a1b13" : "#8d6840");
      };
      const submitText = (): void => {
        if (!fullyRevealed) {
          revealAll();
          return;
        }
        if (!typedValue.trim()) return;
        this.audio.playEffect(GAME_SFX.menuClick.key);
        close(typedValue);
      };
      const handleTextKey = (event: KeyboardEvent): void => {
        if (interaction.kind !== "text") return;
        if (!fullyRevealed) {
          if (event.key === "Enter") revealAll();
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          submitText();
        } else if (event.key === "Backspace") {
          event.preventDefault();
          typedValue = typedValue.slice(0, -1);
          refreshInputText();
        } else if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey &&
          typedValue.length < 32
        ) {
          typedValue += event.key;
          refreshInputText();
        }
      };
      const handleShutdown = (): void => close(null);
      const closeActiveDialogue = (): void => close(null);

      this.activeDialogueClose = closeActiveDialogue;
      blocker.on("pointerdown", advance);
      choiceObjects.forEach((choice, index) => {
        choice.on("pointerdown", choiceHandlers[index]);
      });
      submitChoice.on("pointerdown", submitText);
      this.scene.input.keyboard?.on("keydown-SPACE", advance);
      if (interaction.kind !== "text") {
        this.scene.input.keyboard?.on("keydown-ENTER", advance);
      }
      this.scene.input.keyboard?.on("keydown-E", advance);
      if (
        interaction.kind === "choices" &&
        interaction.options.some(({ value }) => value === "yes")
      ) {
        this.scene.input.keyboard?.on("keydown-Y", chooseYes);
      }
      if (
        interaction.kind === "choices" &&
        interaction.options.some(({ value }) => value === "no")
      ) {
        this.scene.input.keyboard?.on("keydown-N", chooseNo);
      }
      this.scene.input.keyboard?.on("keydown", handleTextKey);
      this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, handleShutdown);

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
    if (
      !voice ||
      this.scene.sound.locked ||
      !this.scene.cache.audio.exists(voice.key)
    ) {
      return;
    }

    this.audio.playEffect(voice.key, {
      volumeMultiplier: 0.55,
      rate: Phaser.Math.FloatBetween(0.96, 1.04)
    });
  }
}
