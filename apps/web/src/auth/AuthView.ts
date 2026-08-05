import type { AuthCredentials } from "@fox-blackjack/shared-types";

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
      <section class="auth-panel" aria-labelledby="auth-title">
        <div class="auth-panel__eyebrow">PLAYER ACCOUNT</div>
        <h1 class="logo-lockup" id="auth-title">
          <span>DEAL ME IN,</span>
          <strong>DUNC</strong>
        </h1>
        <div class="auth-panel__divider" aria-hidden="true"></div>

        <h2 class="auth-panel__title">
          ${isRegister ? "CREATE ACCOUNT" : "WELCOME BACK"}
        </h2>
        <p class="auth-panel__lede">
          ${isRegister ? "Choose a username and password to get started." : "Sign in to continue your game."}
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
      </section>
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
