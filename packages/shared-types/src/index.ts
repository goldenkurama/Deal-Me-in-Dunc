/** Types shared by the browser client and API. Keep this package type-only. */

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

export interface CurrencyBalances {
  readonly chips: number;
  readonly dunkaroos: number;
}
