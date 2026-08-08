import crypto from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { sessionSecret } from "./session-secret";

const COOKIE_NAME = "rifas_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: number;
  username: string;
  exp: number;
};

function sign(value: string): string {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(value)
    .digest("base64url");
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as SessionPayload;

    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function login(
  username: string,
  password: string,
): Promise<boolean> {
  const user = getDb()
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get(username.trim()) as
    | { id: number; username: string; password_hash: string }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) return false;

  const token = encode({
    userId: user.id,
    username: user.username,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  return true;
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  return decode(token);
}
