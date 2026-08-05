import type { ActiveHouseRule } from "./types.js";

export const HOUSE_RULE_DURATION_HANDS = 3;

export function startHouseRule(id: string): ActiveHouseRule {
  if (id.trim().length === 0) {
    throw new Error("House Rule id cannot be empty.");
  }

  return {
    id,
    handsRemaining: HOUSE_RULE_DURATION_HANDS
  };
}

export interface HouseRuleAdvanceResult {
  readonly houseRule: ActiveHouseRule;
  readonly changed: boolean;
  readonly expiredRuleId: string | null;
}

/**
 * Call once after every completed hand. `chooseNextRuleId` is called only
 * when the current rule has completed its third hand.
 */
export function advanceHouseRuleAfterHand(
  current: ActiveHouseRule,
  chooseNextRuleId: (expiredRuleId: string) => string
): HouseRuleAdvanceResult {
  if (current.handsRemaining > 1) {
    return {
      houseRule: {
        ...current,
        handsRemaining: current.handsRemaining - 1
      },
      changed: false,
      expiredRuleId: null
    };
  }

  const nextRuleId = chooseNextRuleId(current.id);

  return {
    houseRule: startHouseRule(nextRuleId),
    changed: true,
    expiredRuleId: current.id
  };
}
