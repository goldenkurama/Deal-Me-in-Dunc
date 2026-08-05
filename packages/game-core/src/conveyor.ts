import type { ActiveTrinket, TrinketSlots } from "./types.js";

export const EMPTY_TRINKET_SLOTS: TrinketSlots = [null, null, null];

export interface AgedTrinketConveyor {
  readonly slots: TrinketSlots;
  readonly expiredTrinket: ActiveTrinket | null;
}

/**
 * Call after a hand completes. Slot 3 expires, Slot 2 moves to Slot 3,
 * Slot 1 moves to Slot 2, and Slot 1 becomes empty for the new selection.
 */
export function ageTrinketConveyor(
  slots: TrinketSlots
): AgedTrinketConveyor {
  return {
    slots: [null, slots[0], slots[1]],
    expiredTrinket: slots[2]
  };
}

export function insertSelectedTrinket(
  agedSlots: TrinketSlots,
  trinket: ActiveTrinket
): TrinketSlots {
  if (agedSlots[0] !== null) {
    throw new Error("Slot 1 must be empty before inserting a selected trinket.");
  }

  return [trinket, agedSlots[1], agedSlots[2]];
}

/** Convenience helper for completing both conveyor steps at once. */
export function advanceTrinketConveyor(
  slots: TrinketSlots,
  selectedTrinket: ActiveTrinket
): AgedTrinketConveyor {
  const aged = ageTrinketConveyor(slots);

  return {
    slots: insertSelectedTrinket(aged.slots, selectedTrinket),
    expiredTrinket: aged.expiredTrinket
  };
}
