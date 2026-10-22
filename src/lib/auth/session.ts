import * as SecureStore from "expo-secure-store";

import { API_V1_URL } from "@/lib/api/config";
import { ApiError, type AuthResponse, type AuthUser } from "@/lib/api/types";

const REFRESH_TOKEN_KEY = "kue.refreshToken";
const USER_KEY = "kue.user";

// Access token lives in memory only. The refresh token and the last known
// profile are persisted in SecureStore so a cold start can restore the
// session without keeping a bearer token on disk.
let accessToken: string | null = null;
let currentUser: AuthUser | null = null;
let refreshInFlight: Promise<AuthUser | null> | null = null;

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  return headers;
}

function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function parseBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function errorFrom(response: Response, body: unknown, fallback: string): ApiError {
  const message =
    body &&
    typeof body === "object" &&
    typeof (body as { message?: unknown }).message === "string" &&
    (body as { message: string }).message.length > 0
      ? (body as { message: string }).message
      : fallback;

  return new ApiError(message, response.status, body);
}

async function persistSession(response: AuthResponse): Promise<void> {
  accessToken = response.accessToken;
  currentUser = response.user;

  await Promise.all([
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user)),
    response.refreshToken
      ? SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken)
      : Promise.resolve(),
  ]);
}

export async function clearSession(): Promise<void> {
  accessToken = null;
  currentUser = null;

  await Promise.all([
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  if (currentUser) return currentUser;

  const raw = await SecureStore.getItemAsync(USER_KEY).catch(() => null);
  if (!raw) return null;

  try {
    currentUser = JSON.parse(raw) as AuthUser;
    return currentUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_V1_URL}/auth/login`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email: email.trim(), password }),
    signal: timeoutSignal(45_000),
  }).catch(() => null);

  if (!response) {
    throw new ApiError("Couldn't reach the Kue API. Check your connection.", 0, null);
  }

  const body = await parseBody(response);
  if (!response.ok) {
    throw errorFrom(response, body, "Invalid email or password.");
  }

  const auth = body as AuthResponse;
  await persistSession(auth);
  return auth.user;
}

/**
 * Must stay in sync with `LegalVersion.Current` on the API and LEGAL_VERSION
 * in the web app. The API rejects a stale consent version.
 */
const LEGAL_VERSION = "2026-10-19";

export async function register(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const response = await fetch(`${API_V1_URL}/auth/register`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      username: input.username.trim(),
      email: input.email.trim(),
      password: input.password,
      isTermsAccepted: true,
      termsVersion: LEGAL_VERSION,
    }),
    signal: timeoutSignal(45_000),
  }).catch(() => null);

  if (!response) {
    throw new ApiError("Couldn't reach the Kue API. Check your connection.", 0, null);
  }

  const body = await parseBody(response);
  if (!response.ok) {
    throw errorFrom(response, body, "Could not create your account.");
  }

  const auth = body as AuthResponse;
  await persistSession(auth);
  return auth.user;
}

/**
 * Rotates the refresh token and returns the restored user. Single-flight so
 * a burst of 401s from parallel screens only triggers one rotation.
 */
export function refreshSession(): Promise<AuthUser | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null);
    if (!refreshToken) {
      accessToken = null;
      currentUser = null;
      return null;
    }

    const response = await fetch(`${API_V1_URL}/auth/refresh`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refreshToken }),
      signal: timeoutSignal(45_000),
    }).catch(() => null);

    if (!response) return null;

    const body = await parseBody(response);
    if (!response.ok) {
      // A definitive auth failure: do not keep replaying a dead refresh token.
      if (response.status === 401) await clearSession();
      return null;
    }

    const auth = body as AuthResponse;
    await persistSession(auth);
    return auth.user;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/**
 * Restores a session on app start. The access token is short-lived, so the
 * refresh token is the durable credential. Returns null when there is no
 * session or the refresh token is dead.
 */
export async function restoreSession(): Promise<AuthUser | null> {
  return refreshSession();
}

export async function signOut(): Promise<void> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null);

  if (refreshToken) {
    await fetch(`${API_V1_URL}/auth/logout`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refreshToken }),
      signal: timeoutSignal(15_000),
    }).catch(() => undefined);
  }

  await clearSession();
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = async () => {
    const headers = authHeaders(init.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    return fetch(`${API_V1_URL}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? timeoutSignal(45_000),
    });
  };

  let response = await send();

  if (response.status === 401) {
    const user = await refreshSession();
    if (user) response = await send();
  }

  return response;
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  const body = await parseBody(response);

  if (!response.ok) {
    throw errorFrom(response, body, "Something went wrong. Please try again.");
  }

  return body as T;
}
