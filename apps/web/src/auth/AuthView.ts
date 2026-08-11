import type { AuthCredentials } from "@fox-blackjack/shared-types";
import { AUTH_ASSETS } from "../assets/authAssets";

export type AuthMode = "login" | "register";

export interface AuthViewOptions {
  readonly mode: AuthMode;
  readonly onSubmit: (credentials: AuthCredentials) => Promise<void>;
  readonly onSwitchMode: () => void;
}

export function renderAuthView(
  root: HTMLElement,
  { mode, onSubmit, onSwitchMode }: AuthViewOptions
): void {
  const isRegister = mode === "register";
  root.innerHTML = `
    <main class="auth-screen auth-screen--${mode}">
      <div class="auth-cover-stage">
        <img
          class="auth-decoration auth-decoration--star"
          src="${AUTH_ASSETS.decorations.star.url}"
          width="${AUTH_ASSETS.decorations.star.width}"
          height="${AUTH_ASSETS.decorations.star.height}"
          alt=""
          aria-hidden="true"
        />
        <img
          class="auth-decoration auth-decoration--skull"
          src="${AUTH_ASSETS.decorations.skull.url}"
          width="${AUTH_ASSETS.decorations.skull.width}"
          height="${AUTH_ASSETS.decorations.skull.height}"
          alt=""
          aria-hidden="true"
        />
        <div class="auth-cover">
        <div class="auth-cover__masthead" aria-hidden="true">
          <span>DEAL ME IN,</span>
          <strong>DUNC</strong>
        </div>
        <p class="auth-cover__kicker" aria-hidden="true">
          BUILT FOR<br />THE MISFITS.
        </p>
        <p class="auth-cover__scribble" aria-hidden="true">
          ${isRegister ? "FIRST RUN!" : "OLD SKOOL"}
        </p>
        <div class="auth-cover__arrow" aria-hidden="true">&#10140;</div>
        <div
          class="auth-cover__hero-placeholder"
          style="--hero-width: ${AUTH_ASSETS.hero.displaySize.width}px; --hero-height: ${AUTH_ASSETS.hero.displaySize.height}px"
          aria-label="Hero illustration coming soon"
        >
          <span>HERO ART</span>
          <strong>COMING<br />SOON</strong>
          <small>${AUTH_ASSETS.hero.displaySize.width} × ${AUTH_ASSETS.hero.displaySize.height} PX</small>
        </div>
        <div class="auth-cover__burst" aria-hidden="true">
          ${isRegister ? "NEW<br />PLAYER" : "WELCOME<br />BACK"}
        </div>

        <section class="auth-panel" aria-labelledby="auth-title">
          <div class="auth-panel__tape" aria-hidden="true"></div>
          <div class="auth-panel__eyebrow">PLAYER ACCESS // ISSUE 001</div>

          <h1 class="auth-panel__title" id="auth-title">
            ${isRegister ? "CREATE ACCOUNT" : "SIGN IN"}
          </h1>
          <p class="auth-panel__lede">
            ${isRegister ? "Grab a username. Make some noise." : "Back for another hand? Get in here."}
          </p>

          <form class="auth-form" novalidate>
            <label class="game-field">
              <span>USERNAME</span>
              <input
                name="username"
                type="text"
                autocomplete="username"
                minlength="3"
                maxlength="20"
                pattern="[A-Za-z0-9_]+"
                required
              />
            </label>

            <label class="game-field">
              <span>PASSWORD</span>
              <input
                name="password"
                type="password"
                autocomplete="${isRegister ? "new-password" : "current-password"}"
                minlength="8"
                required
              />
            </label>

            <p class="auth-form__error" role="alert" aria-live="polite"></p>

            <button class="game-button game-button--primary" type="submit">
              ${isRegister ? "REGISTER" : "SIGN IN"}
            </button>
          </form>

          <button class="auth-panel__switch" type="button">
            ${isRegister ? "Already registered? Sign in." : "Need an account? Register."}
          </button>

          <div class="auth-panel__footer" aria-hidden="true">
            ${isRegister ? "START FRESH // PLAY LOUD" : "RETURNING PLAYER // NO OVERCHARGE"}
          </div>
        </section>

        <div class="auth-cover__info" aria-hidden="true">
          <span>FREE PLAY</span><span>NO ADS</span><span>BROWSER GAME</span><span>EST. 2026</span>
        </div>
        <p class="auth-cover__fineprint" aria-hidden="true">
          NO DRESS CODE. NO VIP LINE. JUST YOU, THE HOUSE, AND WHATEVER HAPPENS NEXT.
        </p>
        </div>
      </div>
    </main>
  `;

  const form = root.querySelector<HTMLFormElement>(".auth-form");
  const switchButton = root.querySelector<HTMLButtonElement>(".auth-panel__switch");
  const errorText = root.querySelector<HTMLElement>(".auth-form__error");
  const submitButton = root.querySelector<HTMLButtonElement>("button[type='submit']");

  if (!form || !switchButton || !errorText || !submitButton) {
    throw new Error("Authentication view failed to initialize");
  }

  switchButton.addEventListener("click", onSwitchMode);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorText.textContent = "";

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const credentials = {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? "")
    };

    submitButton.disabled = true;
    submitButton.textContent = isRegister ? "REGISTERING..." : "SIGNING IN...";

    try {
      await onSubmit(credentials);
    } catch (error) {
      errorText.textContent =
        error instanceof Error ? error.message : "Something went wrong. Try again.";
      submitButton.disabled = false;
      submitButton.textContent = isRegister ? "REGISTER" : "SIGN IN";
    }
  });

  root.querySelector<HTMLInputElement>("input[name='username']")?.focus();
}
