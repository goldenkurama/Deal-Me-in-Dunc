import type {
  ActiveHouseRule,
  ActiveTrinket,
  TrinketSlots
} from "./types.js";
import { advanceTrinketConveyor } from "./conveyor.js";
import { advanceHouseRuleAfterHand } from "./houseRules.js";
import { isDuncanDialogueDue } from "./dialogue.js";

export interface ProgressionState {
  readonly completedHands: number;
  readonly trinkets: TrinketSlots;
  readonly houseRule: ActiveHouseRule;
}

export interface CompletedHandProgression {
  readonly state: ProgressionState;
  readonly expiredTrinketId: string | null;
  readonly expiredHouseRuleId: string | null;
  readonly houseRuleChanged: boolean;
  readonly duncanDialogueDue: boolean;
}

/**
 * Finalizes progression after a resolved hand and after the player selects
 * the mandatory new trinket. The selected trinket enters Slot 1 and begins
 * affecting the next hand.
 */
export function finalizeCompletedHand(
  current: ProgressionState,
  selectedTrinket: ActiveTrinket,
  chooseNextHouseRuleId: (expiredRuleId: string) => string
): CompletedHandProgression {
  const completedHands = current.completedHands + 1;
  const conveyor = advanceTrinketConveyor(
    current.trinkets,
    selectedTrinket
  );
  const houseRule = advanceHouseRuleAfterHand(
    current.houseRule,
    chooseNextHouseRuleId
  );

  return {
    state: {
      completedHands,
      trinkets: conveyor.slots,
      houseRule: houseRule.houseRule
    },
    expiredTrinketId: conveyor.expiredTrinket?.id ?? null,
    expiredHouseRuleId: houseRule.expiredRuleId,
    houseRuleChanged: houseRule.changed,
    duncanDialogueDue: isDuncanDialogueDue(completedHands)
  };
}
