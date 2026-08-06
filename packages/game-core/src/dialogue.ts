export const DEFAULT_DUNCAN_DIALOGUE_INTERVAL = 5;

export interface DialogueCandidate {
  readonly id: string;
  readonly weight: number;
  readonly chance: number;
}

export function isDuncanDialogueDue(
  completedHands: number,
  interval = DEFAULT_DUNCAN_DIALOGUE_INTERVAL
): boolean {
  if (!Number.isSafeInteger(completedHands) || completedHands < 0) {
    throw new Error("completedHands must be a non-negative whole number.");
  }

  if (!Number.isSafeInteger(interval) || interval <= 0) {
    throw new Error("Dialogue interval must be a positive whole number.");
  }

  return completedHands > 0 && completedHands % interval === 0;
}

/**
 * Applies each candidate's chance, then selects one of the remaining entries
 * by weight. Injecting `random` keeps authored dialogue selection testable.
 */
export function selectDialogueCandidate<T extends DialogueCandidate>(
  candidates: readonly T[],
  random: () => number = Math.random
): T | null {
  for (const candidate of candidates) {
    if (!Number.isFinite(candidate.weight) || candidate.weight <= 0) {
      throw new Error("Dialogue weight must be greater than zero.");
    }
    if (
      !Number.isFinite(candidate.chance) ||
      candidate.chance < 0 ||
      candidate.chance > 1
    ) {
      throw new Error("Dialogue chance must be between zero and one.");
    }
  }

  const eligible = candidates.filter(
    (candidate) => candidate.chance === 1 || random() < candidate.chance
  );
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce(
    (total, candidate) => total + candidate.weight,
    0
  );
  const roll = random() * totalWeight;
  let cursor = 0;

  for (const candidate of eligible) {
    cursor += candidate.weight;
    if (roll < cursor) return candidate;
  }

  return eligible[eligible.length - 1] ?? null;
}
