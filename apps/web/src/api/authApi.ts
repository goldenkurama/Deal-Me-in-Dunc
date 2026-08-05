import type {
  ApiErrorResponse,
  AuthCredentials,
  AuthResponse,
  PublicUser
} from "@fox-blackjack/shared-types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    const fallback: ApiErrorResponse = {
      error: "request_failed",
      message: "The server could not complete the request"
    };
    const error = (await response.json().catch(() => fallback)) as ApiErrorResponse;
    throw new ApiError(response.status, error.error, error.message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function register(credentials: AuthCredentials): Promise<PublicUser> {
  const response = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
  return response.user;
}

export async function login(credentials: AuthCredentials): Promise<PublicUser> {
  const response = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
  return response.user;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  try {
    return (await request<AuthResponse>("/api/auth/me")).user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function logout(): Promise<void> {
  await request<void>("/api/auth/logout", { method: "POST" });
}
