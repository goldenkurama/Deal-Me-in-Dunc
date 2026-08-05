import type { PublicUser } from "@fox-blackjack/shared-types";

export interface AuthenticatedSession {
  readonly user: PublicUser;
  readonly token: string;
}

export interface AuthService {
  register(username: string, password: string): Promise<AuthenticatedSession>;
  login(username: string, password: string): Promise<AuthenticatedSession>;
  authenticate(token: string): Promise<PublicUser | null>;
  logout(token: string): Promise<void>;
}

export class AuthError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}
