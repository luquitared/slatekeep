import {
  hashPassword,
  verifyPassword,
  generateId,
  resolveUser,
  json,
  error,
} from "../auth";
import { Env, Document } from "../types";

async function logAudit(
  env: Env,
  documentId: string,
  accessorId: string | null,
  accessorName: string | null,
  accessorType: string,
  action: string,
  ip: string | null
) {
  await env.DB.prepare(
    `INSERT INTO audit_log (id, document_id, accessor_id, accessor_name, accessor_type, action, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(generateId(), documentId, accessorId, accessorName, accessorType, action, ip)
    .run();
}

function getIp(request: Request): string | null {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for");
}

export async function create(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const title = params.get("title")?.trim();
  if (!title) return error("title required");

  const content = params.get("content") || "";
  const password = params.get("password");
  const isPublic = params.get("is_public") === "1" ? 1 : 0;
  const tagsParam = params.get("tags");

  const id = generateId();
  const passwordHash = password ? await hashPassword(password) : null;

  await env.DB.prepare(
    `INSERT INTO documents (id, user_id, title, content, password_hash, is_public)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, user.id, title, content, passwordHash, isPublic)
    .run();

  if (tagsParam) {
    const tagNames = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
    for (const name of tagNames) {
      let tag = await env.DB.prepare(
        "SELECT id FROM tags WHERE name = ? AND user_id = ?"
      )
        .bind(name, user.id)
        .first<{ id: string }>();
      if (!tag) {
        const tagId = generateId();
        await env.DB.prepare(
          "INSERT INTO tags (id, name, user_id) VALUES (?, ?, ?)"
        )
          .bind(tagId, name, user.id)
          .run();
        tag = { id: tagId };
      }
      await env.DB.prepare(
        "INSERT OR IGNORE INTO document_tags (document_id, tag_id) VALUES (?, ?)"
      )
        .bind(id, tag.id)
        .run();
    }
  }

  await logAudit(env, id, user.id, user.display_name || user.username, "user", "create", getIp(request));
  return json({ id, title, is_public: isPublic });
}

export async function update(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const docId = params.get("doc_id");
  if (!docId) return error("doc_id required");

  const doc = await env.DB.prepare(
    "SELECT * FROM documents WHERE id = ? AND user_id = ?"
  )
    .bind(docId, user.id)
    .first<Document>();
  if (!doc) return error("document not found", 404);

  const title = params.get("title")?.trim() || doc.title;
  const content = params.has("content") ? params.get("content")! : doc.content;
  const password = params.get("password");
  const isPublic = params.has("is_public")
    ? params.get("is_public") === "1"
      ? 1
      : 0
    : doc.is_public;

  const passwordHash = password
    ? await hashPassword(password)
    : password === ""
      ? null
      : doc.password_hash;

  await env.DB.prepare(
    `UPDATE documents SET title = ?, content = ?, password_hash = ?, is_public = ?, updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(title, content, passwordHash, isPublic, docId)
    .run();

  await logAudit(env, docId, user.id, user.display_name || user.username, "user", "update", getIp(request));
  return json({ ok: true });
}

export async function get(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const docId = params.get("doc_id");
  if (!docId) return error("doc_id required");

  const doc = await env.DB.prepare(
    "SELECT * FROM documents WHERE id = ? AND user_id = ?"
  )
    .bind(docId, user.id)
    .first<Document>();
  if (!doc) return error("document not found", 404);

  await env.DB.prepare(
    "UPDATE documents SET last_accessed_at = datetime('now') WHERE id = ?"
  )
    .bind(docId)
    .run();

  const tags = await env.DB.prepare(
    `SELECT t.id, t.name FROM tags t
     JOIN document_tags dt ON dt.tag_id = t.id
     WHERE dt.document_id = ?`
  )
    .bind(docId)
    .all<{ id: string; name: string }>();

  const accessorName = params.get("accessor_name") || user.display_name || user.username;
  await logAudit(env, docId, user.id, accessorName, "user", "view", getIp(request));

  return json({
    ...doc,
    password_hash: undefined,
    has_password: !!doc.password_hash,
    tags: tags.results,
  });
}

export async function list(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") || "20")));
  const offset = (page - 1) * limit;
  const tag = params.get("tag");

  let query: string;
  let bindings: unknown[];

  if (tag) {
    query = `SELECT d.id, d.title, d.is_public, d.created_at, d.updated_at, d.last_accessed_at,
                    (d.password_hash IS NOT NULL) as has_password
             FROM documents d
             JOIN document_tags dt ON dt.document_id = d.id
             JOIN tags t ON t.id = dt.tag_id
             WHERE d.user_id = ? AND t.name = ?
             ORDER BY d.updated_at DESC LIMIT ? OFFSET ?`;
    bindings = [user.id, tag, limit, offset];
  } else {
    query = `SELECT id, title, is_public, created_at, updated_at, last_accessed_at,
                    (password_hash IS NOT NULL) as has_password
             FROM documents WHERE user_id = ?
             ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
    bindings = [user.id, limit, offset];
  }

  const docs = await env.DB.prepare(query).bind(...bindings).all();

  // Get tags for each doc
  const results = [];
  for (const doc of docs.results) {
    const docTags = await env.DB.prepare(
      `SELECT t.id, t.name FROM tags t
       JOIN document_tags dt ON dt.tag_id = t.id
       WHERE dt.document_id = ?`
    )
      .bind((doc as { id: string }).id)
      .all<{ id: string; name: string }>();
    results.push({ ...doc, tags: docTags.results });
  }

  return json({ documents: results, page, limit });
}

export async function del(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const docId = params.get("doc_id");
  if (!docId) return error("doc_id required");

  const doc = await env.DB.prepare(
    "SELECT id FROM documents WHERE id = ? AND user_id = ?"
  )
    .bind(docId, user.id)
    .first();
  if (!doc) return error("document not found", 404);

  await env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(docId).run();
  return json({ ok: true });
}

export async function share(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const docId = params.get("doc_id");
  if (!docId) return error("doc_id required");

  const doc = await env.DB.prepare("SELECT * FROM documents WHERE id = ?")
    .bind(docId)
    .first<Document>();
  if (!doc) return error("document not found", 404);
  if (!doc.is_public) return error("document is not public", 403);

  if (doc.password_hash) {
    const password = params.get("password");
    if (!password) return error("password required", 401);
    const valid = await verifyPassword(password, doc.password_hash);
    if (!valid) return error("incorrect password", 401);
  }

  await env.DB.prepare(
    "UPDATE documents SET last_accessed_at = datetime('now') WHERE id = ?"
  )
    .bind(docId)
    .run();

  const accessorName = params.get("accessor_name") || "anonymous";
  await logAudit(env, docId, null, accessorName, "public", "view", getIp(request));

  const tags = await env.DB.prepare(
    `SELECT t.id, t.name FROM tags t
     JOIN document_tags dt ON dt.tag_id = t.id
     WHERE dt.document_id = ?`
  )
    .bind(docId)
    .all<{ id: string; name: string }>();

  return json({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    is_public: doc.is_public,
    has_password: !!doc.password_hash,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    tags: tags.results,
  });
}
