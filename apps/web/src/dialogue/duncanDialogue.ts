import type { HandOutcome } from "@fox-blackjack/game-core";
import {
  isDuncanDialogueDue,
  selectDialogueCandidate
} from "@fox-blackjack/game-core";

export interface DuncanDialogueContext {
  readonly completedHands: number;
  readonly outcome: HandOutcome;
  readonly playerBusted: boolean;
  readonly wager: number;
  readonly chipProfit: number;
  readonly chips: number;
  readonly dunkaroos: number;
}

export interface DuncanDialogueEntry {
  readonly id: string;
  readonly text: string;
  readonly weight: number;
  readonly chance: number;
  readonly when?: (context: DuncanDialogueContext) => boolean;
}

/**
 * Add circumstance-specific five-hand dialogue here. `chance` controls whether
 * an otherwise eligible line enters the weighted selection for that cycle.
 */
export const DUNCAN_CONTEXTUAL_DIALOGUE: readonly DuncanDialogueEntry[] = [
  {
    id: "cycle-blackjack",
    text: "Now that's style.",
    weight: 1,
    chance: 0.65,
    when: ({ outcome }) => outcome === "player-blackjack"
  },
  {
    id: "cycle-player-win",
    text: "Well played.",
    weight: 1,
    chance: 0.4,
    when: ({ outcome }) => outcome === "player-win"
  },
  {
    id: "cycle-push",
    text: "A civilized tie.",
    weight: 1,
    chance: 0.45,
    when: ({ outcome }) => outcome === "push"
  },
  {
    id: "cycle-player-bust",
    text: "A bold choice.",
    weight: 1,
    chance: 0.45,
    when: ({ playerBusted }) => playerBusted
  },
  {
    id: "cycle-dealer-win",
    text: "The cards have spoken.",
    weight: 1,
    chance: 0.35,
    when: ({ outcome, playerBusted }) =>
      outcome === "dealer-win" && !playerBusted
  }
];

/** General lines guarantee that each five-hand dialogue slot has a fallback. */
export const DUNCAN_GENERAL_DIALOGUE: readonly DuncanDialogueEntry[] = [
  {
    id: "cycle-five-hands",
    text: "Five hands down. Let's see what the next five bring.",
    weight: 1,
    chance: 1
  }
];

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
