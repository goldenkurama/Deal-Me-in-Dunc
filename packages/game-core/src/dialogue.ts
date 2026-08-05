export const DEFAULT_DUNCAN_DIALOGUE_INTERVAL = 5;

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
