export interface RandomSource {
  /** Returns a value greater than or equal to 0 and less than 1. */
  next(): number;
}

export const systemRandom: RandomSource = {
  next: () => Math.random()
};

/**
 * Small deterministic generator for tests, replays, and debugging.
 * This is not intended for cryptographic use.
 */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;

  return {
    next(): number {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    }
  };
}
