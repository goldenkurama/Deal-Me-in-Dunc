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
      readonly intro?: readonly string[];
      readonly prompt: string;
      readonly yes: readonly string[];
      readonly no: readonly string[];
    }
  | {
      readonly kind: "choice";
      readonly prompt: string;
      readonly options: readonly {
        readonly value: string;
        readonly label: string;
        readonly response: readonly string[];
      }[];
    }
  | {
      readonly kind: "text";
      readonly prompt: string;
      readonly responses: Readonly<Record<string, readonly string[]>>;
      readonly otherwise: readonly string[];
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

/** These scripts are always eligible at hands 5, 10, 15, and so on. */
export const DUNCAN_GENERAL_DIALOGUE: readonly DuncanDialogueEntry[] = [
  {
    id: "cycle-hit-sixteen",
    script: {
      kind: "yes-no",
      intro: [
        "You know, we haven’t talked that much. Why not have an icebreaker?"
      ],
      prompt: "Do you hit on 16?",
      no: ["Coward."],
      yes: ["Gross. That’s disgusting dude. I only hit on 18 plus."]
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
  },
  {
    id: "cycle-water-trucks",
    script: {
      kind: "lines",
      lines: ["You know…", "Fire trucks are just water trucks right?"]
    },
    weight: 1,
    chance: 1
  },
  {
    id: "cycle-trinket-confusion",
    script: {
      kind: "lines",
      lines: [
        "Dude… I’m gonna be real, I have no idea half of whatever trinkets you’ve been using do.",
        "I’ve just been letting you do your thing."
      ]
    },
    weight: 1,
    chance: 1
  },
  {
    id: "cycle-trinket-source",
    script: {
      kind: "lines",
      lines: [
        "…where are you getting all these trinkets?",
        "Have you been going through my stuff?"
      ]
    },
    weight: 1,
    chance: 1
  },
  {
    id: "cycle-joke-choice",
    script: {
      kind: "choice",
      prompt: "What, tired of my jokes? You think you can do better?",
      options: [
        { value: "yes", label: "YES", response: ["No you can’t."] },
        { value: "no", label: "NO", response: ["Damn right you can’t."] },
        {
          value: "clown",
          label: "I’M A CLOWN ACTUALLY",
          response: ["Well you’re not wearing that much makeup."]
        }
      ]
    },
    weight: 1,
    chance: 1
  },
  {
    id: "cycle-math-question",
    script: {
      kind: "text",
      prompt: "Hey, I heard you’re good at math. What’s 33 + 77?",
      responses: {
        "100": ["LMAO. Add the two numbers again. Slowly this time."],
        "110": ["Smartass."]
      },
      otherwise: [
        "?????",
        "Did you like… need a few more minutes in the oven or something?"
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
