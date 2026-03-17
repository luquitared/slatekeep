import { generateId, resolveUser, json, error } from "../auth";
import { Env } from "../types";

export async function list(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const tags = await env.DB.prepare(
    "SELECT id, name FROM tags WHERE user_id = ? ORDER BY name"
  )
    .bind(user.id)
    .all<{ id: string; name: string }>();

  return json({ tags: tags.results });
}

export async function create(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const name = params.get("name")?.trim();
  if (!name) return error("name required");

  const existing = await env.DB.prepare(
    "SELECT id FROM tags WHERE name = ? AND user_id = ?"
  )
    .bind(name, user.id)
    .first<{ id: string }>();
  if (existing) return json({ id: existing.id, name });

  const id = generateId();
  await env.DB.prepare("INSERT INTO tags (id, name, user_id) VALUES (?, ?, ?)")
    .bind(id, name, user.id)
    .run();

  return json({ id, name });
}

export async function assign(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const docId = params.get("doc_id");
  const tagId = params.get("tag_id");
  if (!docId || !tagId) return error("doc_id and tag_id required");

  const doc = await env.DB.prepare(
    "SELECT id FROM documents WHERE id = ? AND user_id = ?"
  )
    .bind(docId, user.id)
    .first();
  if (!doc) return error("document not found", 404);

  const tag = await env.DB.prepare(
    "SELECT id FROM tags WHERE id = ? AND user_id = ?"
  )
    .bind(tagId, user.id)
    .first();
  if (!tag) return error("tag not found", 404);

  await env.DB.prepare(
    "INSERT OR IGNORE INTO document_tags (document_id, tag_id) VALUES (?, ?)"
  )
    .bind(docId, tagId)
    .run();

  return json({ ok: true });
}

export async function unassign(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const docId = params.get("doc_id");
  const tagId = params.get("tag_id");
  if (!docId || !tagId) return error("doc_id and tag_id required");

  await env.DB.prepare(
    "DELETE FROM document_tags WHERE document_id = ? AND tag_id = ?"
  )
    .bind(docId, tagId)
    .run();

  return json({ ok: true });
}
