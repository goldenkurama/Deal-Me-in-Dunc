import { describe, expect, it } from "vitest";
import {
  EMPTY_TRINKET_SLOTS,
  advanceHouseRuleAfterHand,
  advanceTrinketConveyor,
  isDuncanDialogueDue,
  startHouseRule
} from "../src/index.js";
import type { TrinketSlots } from "../src/index.js";

describe("trinket conveyor", () => {
  it("keeps a selected trinket active for exactly three future hands", () => {
    let slots: TrinketSlots = EMPTY_TRINKET_SLOTS;

    slots = advanceTrinketConveyor(slots, { id: "A" }).slots;
    expect(slots).toEqual([{ id: "A" }, null, null]);

    slots = advanceTrinketConveyor(slots, { id: "B" }).slots;
    expect(slots).toEqual([{ id: "B" }, { id: "A" }, null]);

    slots = advanceTrinketConveyor(slots, { id: "C" }).slots;
    expect(slots).toEqual([{ id: "C" }, { id: "B" }, { id: "A" }]);

    const fourthAdvance = advanceTrinketConveyor(slots, { id: "D" });
    expect(fourthAdvance.expiredTrinket?.id).toBe("A");
    expect(fourthAdvance.slots).toEqual([
      { id: "D" },
      { id: "C" },
      { id: "B" }
    ]);
  });
});

describe("House Rule rotation", () => {
  it("rotates after exactly three completed hands", () => {
    let rule = startHouseRule("cheap-trick");
    const chooseNext = () => "charity-case";

    rule = advanceHouseRuleAfterHand(rule, chooseNext).houseRule;
    expect(rule).toEqual({ id: "cheap-trick", handsRemaining: 2 });

    rule = advanceHouseRuleAfterHand(rule, chooseNext).houseRule;
    expect(rule).toEqual({ id: "cheap-trick", handsRemaining: 1 });

    const rotation = advanceHouseRuleAfterHand(rule, chooseNext);
    expect(rotation.changed).toBe(true);
    expect(rotation.expiredRuleId).toBe("cheap-trick");
    expect(rotation.houseRule).toEqual({
      id: "charity-case",
      handsRemaining: 3
    });
  });
});

describe("Duncan dialogue timing", () => {
  it("triggers after every fifth completed hand", () => {
    expect(isDuncanDialogueDue(4)).toBe(false);
    expect(isDuncanDialogueDue(5)).toBe(true);
    expect(isDuncanDialogueDue(6)).toBe(false);
    expect(isDuncanDialogueDue(10)).toBe(true);
  });
});
