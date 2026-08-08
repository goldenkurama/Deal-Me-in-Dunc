import { Router, type Response } from "express";
import type {
  BlackjackOutcome,
  HandSettlementRequest
} from "@fox-blackjack/shared-types";
import type { AuthService } from "../services/authService.js";
import { GameError, type GameService } from "../services/gameService.js";
import { readSessionToken } from "./auth.js";

const HAND_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BLACKJACK_OUTCOMES: readonly BlackjackOutcome[] = [
  "player-blackjack",
  "player-win",
  "dealer-win",
  "push"
];

function isBlackjackOutcome(value: unknown): value is BlackjackOutcome {
  return (
    typeof value === "string" &&
    BLACKJACK_OUTCOMES.includes(value as BlackjackOutcome)
  );
}

function readSettlement(body: unknown): HandSettlementRequest {
  if (
    typeof body !== "object" ||
    body === null ||
    !("handId" in body) ||
    !("wager" in body) ||
    !("chipsStaked" in body) ||
    !("chipsAwarded" in body) ||
    !("dunkaroosAwarded" in body) ||
    !("outcome" in body) ||
    typeof body.handId !== "string" ||
    !HAND_ID_PATTERN.test(body.handId) ||
    typeof body.wager !== "number" ||
    !Number.isSafeInteger(body.wager) ||
    body.wager <= 0 ||
    typeof body.chipsStaked !== "number" ||
    !Number.isSafeInteger(body.chipsStaked) ||
    body.chipsStaked < 0 ||
    body.chipsStaked > body.wager ||
    typeof body.chipsAwarded !== "number" ||
    !Number.isSafeInteger(body.chipsAwarded) ||
    body.chipsAwarded < 0 ||
    typeof body.dunkaroosAwarded !== "number" ||
    !Number.isSafeInteger(body.dunkaroosAwarded) ||
    body.dunkaroosAwarded < 0 ||
    !isBlackjackOutcome(body.outcome)
  ) {
    throw new GameError(400, "invalid_settlement", "Invalid hand settlement");
  }

  return {
    handId: body.handId,
    wager: body.wager,
    chipsStaked: body.chipsStaked,
    chipsAwarded: body.chipsAwarded,
    dunkaroosAwarded: body.dunkaroosAwarded,
    outcome: body.outcome
  };
}

function sendError(response: Response, error: unknown): void {
  if (error instanceof GameError) {
    response.status(error.status).json({ error: error.code, message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: "internal_error",
    message: "The server could not complete the request"
  });
}

export function createGameRouter(
  authService: AuthService,
  gameService: GameService
): Router {
  const router = Router();

  router.post("/settle", async (request, response) => {
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

      const settlement = readSettlement(request.body);
      response.json(await gameService.settleHand(user.id, settlement));
    } catch (error) {
      sendError(response, error);
    }
  });

  return router;
}
