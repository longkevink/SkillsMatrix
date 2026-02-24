const AUTH_COOKIE_NAME = "site_auth";
const LOGIN_ATTEMPTS_COOKIE_NAME = "login_attempts";
const AUTH_TOKEN_TTL_SECONDS = 12 * 60 * 60;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 15 * 60;

interface AuthTokenPayload {
  exp: number;
}

interface LoginAttemptState {
  count: number;
  lockedUntil: number | null;
}

function getAuthSecret() {
  const secret = process.env.SITE_AUTH_SECRET;
  return secret ?? null;
}

function getSitePassword() {
  const password = process.env.SITE_PASSWORD;
  return password ?? null;
}

function bytesToBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlToBytes(input: string) {
  return Uint8Array.from(Buffer.from(input, "base64url"));
}

async function sign(value: string) {
  const secret = getAuthSecret();
  if (!secret) {
    return null;
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSignedAuthToken() {
  if (!getAuthSecret()) {
    return null;
  }
  const payload: AuthTokenPayload = {
    exp: Math.floor(Date.now() / 1000) + AUTH_TOKEN_TTL_SECONDS,
  };
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(encodedPayload);
  if (!signature) {
    return null;
  }
  return `${encodedPayload}.${signature}`;
}

export async function verifySignedAuthToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await sign(encodedPayload);
  if (!expectedSignature) {
    return false;
  }
  if (expectedSignature !== signature) {
    return false;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload))) as AuthTokenPayload;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function parseLoginAttemptState(raw: string | undefined): LoginAttemptState {
  if (!raw) {
    return { count: 0, lockedUntil: null };
  }
  try {
    const parsed = JSON.parse(raw) as LoginAttemptState;
    return {
      count: Number.isFinite(parsed.count) ? parsed.count : 0,
      lockedUntil:
        parsed.lockedUntil !== null && Number.isFinite(parsed.lockedUntil) ? parsed.lockedUntil : null,
    };
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

export function getFailedLoginState(current: LoginAttemptState): LoginAttemptState {
  const now = Math.floor(Date.now() / 1000);
  const stillLocked = current.lockedUntil !== null && current.lockedUntil > now;
  const nextCount = current.count + 1;
  if (nextCount >= MAX_LOGIN_ATTEMPTS) {
    return {
      count: nextCount,
      lockedUntil: now + LOCKOUT_WINDOW_SECONDS,
    };
  }
  return {
    count: nextCount,
    lockedUntil: stillLocked ? current.lockedUntil : null,
  };
}

export function isLockedOut(state: LoginAttemptState) {
  const now = Math.floor(Date.now() / 1000);
  return state.lockedUntil !== null && state.lockedUntil > now;
}

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}

export function getLoginAttemptsCookieName() {
  return LOGIN_ATTEMPTS_COOKIE_NAME;
}

export function getAuthTokenTtlSeconds() {
  return AUTH_TOKEN_TTL_SECONDS;
}

export function isPasswordConfigured() {
  return Boolean(getSitePassword());
}

export function isPasswordMatch(value: unknown) {
  const password = getSitePassword();
  if (!password || typeof value !== "string") {
    return false;
  }
  return value === password;
}
