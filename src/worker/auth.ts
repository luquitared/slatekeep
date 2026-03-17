import { Env, User } from "./types";

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  return [...(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `${toHex(salt)}:${toHex(derived)}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  const salt = fromHex(saltHex);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return toHex(derived) === hashHex;
}

export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toHex(hash);
}

export function generateId(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

export function generateToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export function generateApiKey(): string {
  return "sk_" + toHex(crypto.getRandomValues(new Uint8Array(24)));
}

export async function resolveUser(
  env: Env,
  params: URLSearchParams
): Promise<User | null> {
  const sessionToken = params.get("session");
  if (sessionToken) {
    const row = await env.DB.prepare(
      `SELECT u.* FROM users u
       JOIN sessions s ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > datetime('now')`
    )
      .bind(sessionToken)
      .first<User>();
    return row ?? null;
  }

  const apiKey = params.get("api_key");
  if (apiKey) {
    const keyHash = await sha256(apiKey);
    const row = await env.DB.prepare(
      `SELECT u.* FROM users u
       JOIN api_keys ak ON ak.user_id = u.id
       WHERE ak.key_hash = ?`
    )
      .bind(keyHash)
      .first<User>();
    return row ?? null;
  }

  return null;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}
