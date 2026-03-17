import { resolveUser, json, error } from "../auth";
import { Env, AuditEntry } from "../types";

export async function list(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const docId = params.get("doc_id");
  if (!docId) return error("doc_id required");

  // Verify ownership
  const doc = await env.DB.prepare(
    "SELECT id FROM documents WHERE id = ? AND user_id = ?"
  )
    .bind(docId, user.id)
    .first();
  if (!doc) return error("document not found", 404);

  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") || "50")));
  const offset = (page - 1) * limit;

  const entries = await env.DB.prepare(
    `SELECT id, document_id, accessor_id, accessor_name, accessor_type, action, ip_address, created_at
     FROM audit_log WHERE document_id = ?
     ORDER BY created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(docId, limit, offset)
    .all<AuditEntry>();

  return json({ entries: entries.results, page, limit });
}
