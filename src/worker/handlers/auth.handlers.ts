import {
  hashPassword,
  verifyPassword,
  generateId,
  generateToken,
  generateApiKey,
  sha256,
  resolveUser,
  json,
  error,
} from "../auth";
import { Env, User, ApiKey } from "../types";

function createSession(env: Env, userId: string) {
  const token = generateToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
  )
    .bind(token, userId, expires)
    .run()
    .then(() => token);
}

export async function register(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const username = params.get("username")?.trim();
  const password = params.get("password");
  const displayName = params.get("display_name")?.trim() || username;

  if (!username || !password) return error("username and password required");
  if (username.length < 3) return error("username must be at least 3 characters");
  if (password.length < 8) return error("password must be at least 8 characters");

  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE username = ?"
  )
    .bind(username)
    .first();
  if (existing) return error("username taken", 409);

  const id = generateId();
  const passwordHash = await hashPassword(password);
  await env.DB.prepare(
    "INSERT INTO users (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)"
  )
    .bind(id, username, passwordHash, displayName)
    .run();

  const token = await createSession(env, id);
  return json({ session: token, user_id: id, username, display_name: displayName });
}

export async function login(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const username = params.get("username");
  const password = params.get("password");
  if (!username || !password) return error("username and password required");

  const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?")
    .bind(username)
    .first<User>();
  if (!user) return error("invalid credentials", 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return error("invalid credentials", 401);

  const token = await createSession(env, user.id);
  return json({
    session: token,
    user_id: user.id,
    username: user.username,
    display_name: user.display_name,
  });
}

export async function anonymous(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const id = generateId();
  const displayName = `anon-${id.substring(0, 8)}`;
  const passwordHash = await hashPassword(generateToken()); // random unusable password
  await env.DB.prepare(
    "INSERT INTO users (id, password_hash, is_anonymous, display_name) VALUES (?, ?, 1, ?)"
  )
    .bind(id, passwordHash, displayName)
    .run();

  const token = await createSession(env, id);
  return json({ session: token, user_id: id, display_name: displayName, is_anonymous: true });
}

export async function me(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);
  return json({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    is_anonymous: !!user.is_anonymous,
    created_at: user.created_at,
  });
}

export async function logout(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const session = params.get("session");
  if (!session) return error("session required");
  await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(session).run();
  return json({ ok: true });
}

export async function keysCreate(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const label = params.get("label")?.trim() || "default";
  const rawKey = generateApiKey();
  const keyHash = await sha256(rawKey);
  const keyPrefix = rawKey.substring(0, 10);
  const id = generateId();

  await env.DB.prepare(
    "INSERT INTO api_keys (id, user_id, key_hash, key_prefix, label) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, user.id, keyHash, keyPrefix, label)
    .run();

  return json({ id, key: rawKey, key_prefix: keyPrefix, label });
}

export async function keysList(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const keys = await env.DB.prepare(
    "SELECT id, key_prefix, label, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(user.id)
    .all<Pick<ApiKey, "id" | "key_prefix" | "label" | "created_at">>();

  return json({ keys: keys.results });
}

export async function keysDelete(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const keyId = params.get("key_id");
  if (!keyId) return error("key_id required");

  await env.DB.prepare("DELETE FROM api_keys WHERE id = ? AND user_id = ?")
    .bind(keyId, user.id)
    .run();

  return json({ ok: true });
}
