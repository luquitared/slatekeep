import { resolveUser, json, error } from "../auth";
import { Env } from "../types";

export async function grep(
  request: Request,
  env: Env,
  params: URLSearchParams
): Promise<Response> {
  const user = await resolveUser(env, params);
  if (!user) return error("unauthorized", 401);

  const q = params.get("q")?.trim();
  if (!q) return error("q (query) required");

  const tag = params.get("tag");
  const caseSensitive = params.get("case_sensitive") === "1";

  let query: string;
  let bindings: unknown[];

  if (tag) {
    query = `SELECT d.id, d.title, d.content, d.updated_at
             FROM documents d
             JOIN document_tags dt ON dt.document_id = d.id
             JOIN tags t ON t.id = dt.tag_id
             WHERE d.user_id = ? AND t.name = ?
             ORDER BY d.updated_at DESC`;
    bindings = [user.id, tag];
  } else {
    query = `SELECT id, title, content, updated_at
             FROM documents WHERE user_id = ?
             ORDER BY updated_at DESC`;
    bindings = [user.id];
  }

  const docs = await env.DB.prepare(query).bind(...bindings).all<{
    id: string;
    title: string;
    content: string;
    updated_at: string;
  }>();

  const results = [];
  for (const doc of docs.results) {
    const content = caseSensitive ? doc.content : doc.content.toLowerCase();
    const search = caseSensitive ? q : q.toLowerCase();

    if (content.includes(search) || (caseSensitive ? doc.title : doc.title.toLowerCase()).includes(search)) {
      // Extract snippet around first match
      const idx = content.indexOf(search);
      let snippet = "";
      if (idx >= 0) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(doc.content.length, idx + q.length + 60);
        snippet = (start > 0 ? "..." : "") + doc.content.substring(start, end) + (end < doc.content.length ? "..." : "");
      }
      results.push({
        id: doc.id,
        title: doc.title,
        snippet,
        updated_at: doc.updated_at,
      });
    }
  }

  return json({ results, total: results.length });
}
