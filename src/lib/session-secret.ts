const DEV_FALLBACK = "dev-only-insecure-secret";

/**
 * The development fallback must never reach production: anyone who knows it can
 * forge a valid admin session cookie without ever needing a password.
 */
export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is required in production. Generate one with: openssl rand -base64 32",
    );
  }

  return DEV_FALLBACK;
}
