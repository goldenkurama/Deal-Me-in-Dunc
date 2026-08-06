import type { HandOutcome } from "@fox-blackjack/game-core";
import {
  isDuncanDialogueDue,
  selectDialogueCandidate
} from "@fox-blackjack/game-core";

export const DUNCAN_BEFORE_PLAY_DIALOGUE = [
  "You here to play hand?",
  "Dude… You gonna play or what?",
  "Wassup dawg."
] as const;

export type DuncanDialogueScript =
  | {
      readonly kind: "lines";
      readonly lines: readonly string[];
    }
  | {
      readonly kind: "yes-no";
      readonly prompt: string;
      readonly yes: readonly string[];
      readonly no: readonly string[];
    };

export interface DuncanDialogueContext {
  readonly completedHands: number;
  readonly outcome: HandOutcome;
  readonly lostFiveInARow: boolean;
  readonly bustedAfterHighHit: boolean;
}

export interface DuncanDialogueEntry {
  readonly id: string;
  readonly script: DuncanDialogueScript;
  readonly weight: number;
  readonly chance: number;
  readonly when?: (context: DuncanDialogueContext) => boolean;
}

/**
 * Circumstance-specific entries only compete for the five-hand dialogue slot
 * when their requirement is true and their chance roll succeeds.
 */
export const DUNCAN_CONTEXTUAL_DIALOGUE: readonly DuncanDialogueEntry[] = [
  {
    id: "cycle-win",
    script: { kind: "lines", lines: ["That’s crazy dawg."] },
    weight: 1,
    chance: 0.55,
    when: ({ outcome }) =>
      outcome === "player-win" || outcome === "player-blackjack"
  },
  {
    id: "cycle-five-losses",
    script: {
      kind: "lines",
      lines: ["Dude, is your name Owen?", "O and 5!"]
    },
    weight: 1,
    chance: 0.75,
    when: ({ lostFiveInARow }) => lostFiveInARow
  },
  {
    id: "cycle-high-hit-bust",
    script: {
      kind: "lines",
      lines: ["You do know how to play Blackjack right?"]
    },
    weight: 1,
    chance: 0.7,
    when: ({ bustedAfterHighHit }) => bustedAfterHighHit
  }
];

/** These two scripts are always eligible at hands 5, 10, 15, and so on. */
export const DUNCAN_GENERAL_DIALOGUE: readonly DuncanDialogueEntry[] = [
  {
    id: "cycle-hit-sixteen",
    script: {
      kind: "yes-no",
      prompt: "Do you hit on 16?",
      no: ["Coward."],
      yes: ["Gross. I only hit on 18 plus."]
    },
    weight: 1,
    chance: 1
  },
  {
    id: "cycle-ring-finger",
    script: {
      kind: "lines",
      lines: [
        "Dude, did you know that if your ring finger’s the same size as your index finger, that means you're gay?",
        "Dude… Why'd you check?"
      ]
    },
    weight: 1,
    chance: 1
  }
];

export function selectBeforePlayDialogue(
  random: () => number = Math.random
): string {
  const index = Math.floor(random() * DUNCAN_BEFORE_PLAY_DIALOGUE.length);
  return DUNCAN_BEFORE_PLAY_DIALOGUE[index] ?? DUNCAN_BEFORE_PLAY_DIALOGUE[0];
}

export function selectDuncanCycleDialogue(
  context: DuncanDialogueContext,
  random: () => number = Math.random
): DuncanDialogueEntry | null {
  if (!isDuncanDialogueDue(context.completedHands)) return null;

  const contextual = DUNCAN_CONTEXTUAL_DIALOGUE.filter(
    (entry) => entry.when?.(context) ?? true
  );

  return (
    selectDialogueCandidate(contextual, random) ??
    selectDialogueCandidate(DUNCAN_GENERAL_DIALOGUE, random)
  );
}
