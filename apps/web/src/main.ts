import type { PublicUser } from "@fox-blackjack/shared-types";
import { ApiError, getCurrentUser, login, logout, register } from "./api/authApi";
import { renderAuthView, type AuthMode } from "./auth/AuthView";
import { createGame } from "./game/createGame";
import "./styles.css";

const rootElement = document.querySelector<HTMLElement>("#app");
if (!rootElement) throw new Error("Missing application root");
const root: HTMLElement = rootElement;

let currentUser: PublicUser | null = null;
let game: Phaser.Game | null = null;

function currentRoute(): "login" | "register" | "game" {
  const route = window.location.hash.replace(/^#\/?/, "");
  if (route === "register" || route === "game") return route;
  return "login";
}

function navigate(route: "login" | "register" | "game"): void {
  const nextHash = `#/${route}`;
  if (window.location.hash === nextHash) {
    renderRoute();
  } else {
    window.location.hash = nextHash;
  }
}

function destroyGame(): void {
  game?.destroy(true);
  game = null;
}

function showAuth(mode: AuthMode): void {
  destroyGame();
  root.className = "app app--auth";

  renderAuthView(root, {
    mode,
    onSwitchMode: () => navigate(mode === "login" ? "register" : "login"),
    async onSubmit(credentials) {
      try {
        currentUser =
          mode === "login"
            ? await login(credentials)
            : await register(credentials);
        navigate("game");
      } catch (error) {
        if (error instanceof ApiError) throw new Error(error.message);
        throw new Error("Could not reach Duncan's table. Try again in a moment.");
      }
    }
  });
}

function showGame(user: PublicUser): void {
  if (game) return;

  root.className = "app app--game";
  root.innerHTML = `
    <main class="game-page">
      <div class="game-page__frame">
        <div id="game" aria-label="Deal Me In, Dunc game canvas"></div>
      </div>
    </main>
  `;

  const gameRoot = root.querySelector<HTMLElement>("#game");
  if (!gameRoot) throw new Error("Missing game canvas root");

  game = createGame(gameRoot, user, () => {
    void (async () => {
      await logout().catch(() => undefined);
      currentUser = null;
      destroyGame();
      navigate("login");
    })();
  });
}

function renderRoute(): void {
  const route = currentRoute();

  if (route === "game") {
    if (!currentUser) {
      navigate("login");
      return;
    }
    showGame(currentUser);
    return;
  }

  if (currentUser) {
    navigate("game");
    return;
  }

  showAuth(route);
}

async function start(): Promise<void> {
  root.className = "app app--loading";
  root.innerHTML = `<div class="loading-card">SHUFFLING THE DECK...</div>`;

  try {
    currentUser = await getCurrentUser();
  } catch {
    root.innerHTML = `
      <div class="loading-card loading-card--error">
        Duncan's table is offline. Refresh to try again.
      </div>
    `;
    return;
  }

  if (!window.location.hash) {
    navigate(currentUser ? "game" : "login");
  } else {
    renderRoute();
  }
}

window.addEventListener("hashchange", renderRoute);
void start();
