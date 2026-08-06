import { Router } from "express";
import type { AuthCredentials } from "@fox-blackjack/shared-types";
import { AuthError, type AuthService } from "../services/authService.js";

export const SESSION_COOKIE_NAME = "deal_me_in_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function readCredentials(body: unknown): AuthCredentials {
  if (
    typeof body !== "object" ||
    body === null ||
    !("username" in body) ||
    !("password" in body) ||
    typeof body.username !== "string" ||
    typeof body.password !== "string"
  ) {
    throw new AuthError(400, "invalid_request", "Username and password are required");
  }

  return { username: body.username, password: body.password };
}

function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator === -1) continue;

    const key = cookie.slice(0, separator).trim();
    if (key === name) return decodeURIComponent(cookie.slice(separator + 1));
  }

  return null;
}

export function readSessionToken(cookieHeader: string | undefined): string | null {
  return readCookie(cookieHeader, SESSION_COOKIE_NAME);
}

function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

function expiredSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function sendError(response: import("express").Response, error: unknown): void {
  if (error instanceof AuthError) {
    response.status(error.status).json({ error: error.code, message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: "internal_error",
    message: "The server could not complete the request"
  });
}

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post("/register", async (request, response) => {
    try {
      const credentials = readCredentials(request.body);
      const session = await authService.register(
        credentials.username,
        credentials.password
      );
      response.setHeader("Set-Cookie", sessionCookie(session.token));
      response.status(201).json({ user: session.user });
    } catch (error) {
      sendError(response, error);
    }
  });

  router.post("/login", async (request, response) => {
    try {
      const credentials = readCredentials(request.body);
      const session = await authService.login(
        credentials.username,
        credentials.password
      );
      response.setHeader("Set-Cookie", sessionCookie(session.token));
      response.json({ user: session.user });
    } catch (error) {
      sendError(response, error);
    }
  });

  router.get("/me", async (request, response) => {
    try {
      const token = readSessionToken(request.headers.cookie);
      const user = token ? await authService.authenticate(token) : null;

      if (!user) {
        response.status(401).json({
          error: "not_authenticated",
          message: "Sign in to continue"
        });
        return;
      }

      response.json({ user });
    } catch (error) {
      sendError(response, error);
    }
  });

  router.post("/logout", async (request, response) => {
    try {
      const token = readSessionToken(request.headers.cookie);
      if (token) await authService.logout(token);

      response.setHeader("Set-Cookie", expiredSessionCookie());
      response.status(204).end();
    } catch (error) {
      sendError(response, error);
    }
  });

  return router;
}
