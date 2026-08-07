import type { PublicUser } from "@fox-blackjack/shared-types";
import { ApiError, getCurrentUser, login, logout, register } from "./api/authApi";
import { renderAuthView, type AuthMode } from "./auth/AuthView";
import { createGame } from "./game/createGame";
import { GAME_FONT_NAME } from "./config/typography";
import { GAME_SFX } from "./assets";
import { AudioManager, getAudioSettings } from "./audio/AudioManager";
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
      <div class="game-page__layout">
        <nav class="game-menu" aria-label="Game menu">
          <button class="game-menu__button game-menu__button--daily" type="button">
            <span>DAILY</span>
            <span>PASSWORD</span>
          </button>
          <button class="game-menu__button" id="shop-button" type="button">SHOP</button>
          <button class="game-menu__button" id="logout-button" type="button">LOG OUT</button>
        </nav>

        <div class="game-page__frame">
          <div id="game" aria-label="Deal Me In, Dunc game canvas"></div>
        </div>

        <section class="audio-controls" aria-label="Audio controls">
          <label class="audio-control">
            <span>MUSIC</span>
            <input id="music-volume" type="range" min="0" max="100" value="35" aria-label="Music volume">
          </label>
          <label class="audio-control">
            <span>SFX</span>
            <input id="sfx-volume" type="range" min="0" max="100" value="70" aria-label="Sound effects volume">
          </label>
        </section>
      </div>
    </main>
  `;

  const gameRoot = root.querySelector<HTMLElement>("#game");
  const shopButton = root.querySelector<HTMLButtonElement>("#shop-button");
  const logoutButton = root.querySelector<HTMLButtonElement>("#logout-button");
  const musicVolume = root.querySelector<HTMLInputElement>("#music-volume");
  const effectsVolume = root.querySelector<HTMLInputElement>("#sfx-volume");
  if (!gameRoot) throw new Error("Missing game canvas root");
  if (!shopButton || !logoutButton) throw new Error("Missing game menu controls");
  if (!musicVolume || !effectsVolume) {
    throw new Error("Missing audio controls");
  }

  game = createGame(gameRoot, user);
  const audioSettings = getAudioSettings();
  musicVolume.value = String(Math.round(audioSettings.musicVolume * 100));
  effectsVolume.value = String(Math.round(audioSettings.effectsVolume * 100));

  const getActiveAudio = (): AudioManager | null => {
    const activeScene = game?.scene.getScenes(true)[0];
    return activeScene ? new AudioManager(activeScene) : null;
  };

  musicVolume.addEventListener("input", () => {
    getActiveAudio()?.updateSettings({
      musicVolume: Number(musicVolume.value) / 100
    });
  });
  effectsVolume.addEventListener("input", () => {
    getActiveAudio()?.updateSettings({
      effectsVolume: Number(effectsVolume.value) / 100
    });
  });

  const playMenuClick = (): void => {
    getActiveAudio()?.playEffect(GAME_SFX.menuClick.key);
  };

  for (const button of root.querySelectorAll<HTMLButtonElement>(
    ".game-menu__button"
  )) {
    button.addEventListener("click", playMenuClick);
  }

  shopButton.addEventListener("click", () => game?.scene.start("ShopScene"));
  logoutButton.addEventListener("click", () => {
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

  await document.fonts.load(`16px "${GAME_FONT_NAME}"`);

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
