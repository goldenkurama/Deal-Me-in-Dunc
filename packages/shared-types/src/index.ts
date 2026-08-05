/**
 * Types shared by the browser client and API.
 *
 * Keep this package free of Phaser, Express, MySQL, and other runtime
 * dependencies. It should contain only serializable constants and types.
 */

export interface ApiErrorResponse {
  readonly error: string;
  readonly message: string;
}

export interface HealthResponse {
  readonly ok: true;
  readonly service: string;
}

export interface PublicUser {
  readonly id: string;
  readonly username: string;
  readonly chips: number;
  readonly dunkaroos: number;
}

export interface AuthResponse {
  readonly user: PublicUser;
}

export interface AuthCredentials {
  readonly username: string;
  readonly password: string;
}

export interface CurrencyBalances {
  readonly chips: number;
  readonly dunkaroos: number;
}

/**
 * Cosmetic categories supported by the shop and equipment system.
 *
 * Keep these values synchronized with:
 * - the user_equipment.category SQL CHECK constraint
 * - the server-side shop catalog
 * - the client-side cosmetic loader
 */
export const SHOP_CATEGORIES = [
  "card_back",
  "table",
  "music",
  "win_sound",
  "bust_sound",
  "decoration"
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

/**
 * The equipped item key for each cosmetic category.
 *
 * A null value means the built-in default. For decoration, null means that no
 * decoration is equipped.
 */
export type CosmeticLoadout = Readonly<
  Record<ShopCategory, string | null>
>;

/**
 * Result of a player's one-per-day dealer code attempt.
 */
export type DealerAttemptOutcome =
  | "rewarded"
  | "incorrect"
  | "alternate_dialogue";
