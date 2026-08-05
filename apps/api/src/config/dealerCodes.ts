import { GAME_RULES } from "./gameRules.js";

export type WeekdayName =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface DealerCodeDefinition {
  hint: string;
  acceptedAnswers: readonly string[];
  rewardChips: number;
  correctDialogue: string;
  incorrectDialogue: string;
  alternateAnswers?: Readonly<Record<string, string>>;
}

// Hints and dialogue are intentionally TODOs because their wording has not
// been decided. Accepted answers remain server-side and are never sent to the client.
export const DEALER_CODES: Readonly<Record<WeekdayName, DealerCodeDefinition>> = {
  sunday: {
    hint: "TODO: add Sunday's hint",
    acceptedAnswers: [
      "fucking cream of potato soup",
      "cream of potato soup",
      "cream of potato"
    ],
    rewardChips: GAME_RULES.dailyDealerCodeChips,
    correctDialogue: "TODO: add Sunday's correct dialogue",
    incorrectDialogue: "TODO: add Sunday's incorrect dialogue"
  },
  monday: {
    hint: "TODO: add Monday's hint",
    acceptedAnswers: ["rhydon this dick", "rhydon this dih"],
    rewardChips: GAME_RULES.dailyDealerCodeChips,
    correctDialogue: "TODO: add Monday's correct dialogue",
    incorrectDialogue: "TODO: add Monday's incorrect dialogue"
  },
  tuesday: {
    hint: "TODO: add Tuesday's hint",
    acceptedAnswers: ["its chewsday innit", "it's chewsday innit"],
    rewardChips: GAME_RULES.dailyDealerCodeChips,
    correctDialogue: "TODO: add Tuesday's correct dialogue",
    incorrectDialogue: "TODO: add Tuesday's incorrect dialogue"
  },
  wednesday: {
    hint: "TODO: add Wednesday's hint",
    acceptedAnswers: ["glass cannon", "split shot", "ricochet"],
    rewardChips: GAME_RULES.dailyDealerCodeChips,
    correctDialogue: "TODO: add Wednesday's correct dialogue",
    incorrectDialogue: "TODO: add Wednesday's incorrect dialogue"
  },
  thursday: {
    hint: "TODO: add Thursday's hint",
    acceptedAnswers: ["who", "who?"],
    rewardChips: GAME_RULES.dailyDealerCodeChips,
    correctDialogue: "TODO: add Thursday's correct dialogue",
    incorrectDialogue: "TODO: add Thursday's incorrect dialogue"
  },
  friday: {
    hint: "TODO: add Friday's hint",
    acceptedAnswers: ["jacob", "flowery", "flowey", "ralsei"],
    rewardChips: GAME_RULES.dailyDealerCodeChips,
    correctDialogue: "TODO: add Friday's correct dialogue",
    incorrectDialogue: "TODO: add Friday's incorrect dialogue"
  },
  saturday: {
    hint: "TODO: add Saturday's hint",
    acceptedAnswers: ["stupid"],
    rewardChips: GAME_RULES.dailyDealerCodeChips,
    correctDialogue: "TODO: add Saturday's correct dialogue",
    incorrectDialogue: "TODO: add Saturday's incorrect dialogue",
    alternateAnswers: {
      "like a plastic bag": "TODO: add Saturday's alternate dialogue"
    }
  }
};

export function normalizeDealerAnswer(input: string): string {
  return input
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}
