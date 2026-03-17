const BASE = "/api";

function getSession(): string | null {
  return localStorage.getItem("session");
}

export function setSession(token: string | null) {
  if (token) {
    localStorage.setItem("session", token);
  } else {
    localStorage.removeItem("session");
  }
}

export async function api<T = unknown>(
  path: string,
  params: Record<string, string | number | boolean | undefined | null> = {}
): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  const session = getSession();
  if (session) url.searchParams.set("session", session);

  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// Auth
export const authRegister = (username: string, password: string, display_name?: string) =>
  api<{ session: string; user_id: string; username: string; display_name: string }>(
    "/auth/register",
    { username, password, display_name }
  );

export const authLogin = (username: string, password: string) =>
  api<{ session: string; user_id: string; username: string; display_name: string }>(
    "/auth/login",
    { username, password }
  );

export const authAnonymous = () =>
  api<{ session: string; user_id: string; display_name: string }>("/auth/anonymous");

export const authMe = () =>
  api<{ id: string; username: string | null; display_name: string; is_anonymous: boolean }>("/auth/me");

export const authLogout = () => api("/auth/logout");

// Keys
export const keysCreate = (label: string) =>
  api<{ id: string; key: string; key_prefix: string; label: string }>("/keys/create", { label });

export const keysList = () =>
  api<{ keys: { id: string; key_prefix: string; label: string; created_at: string }[] }>("/keys/list");

export const keysDelete = (key_id: string) => api("/keys/delete", { key_id });

// Documents
export interface DocSummary {
  id: string;
  title: string;
  is_public: number;
  has_password: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
  tags: { id: string; name: string }[];
}

export interface DocFull extends DocSummary {
  content: string;
  user_id: string;
}

export const docsCreate = (params: {
  title: string;
  content?: string;
  password?: string;
  is_public?: string;
  tags?: string;
}) => api<{ id: string }>("/docs/create", params);

export const docsUpdate = (params: {
  doc_id: string;
  title?: string;
  content?: string;
  password?: string;
  is_public?: string;
}) => api("/docs/update", params);

export const docsGet = (doc_id: string) => api<DocFull>("/docs/get", { doc_id });

export const docsList = (params?: { tag?: string; page?: number; limit?: number }) =>
  api<{ documents: DocSummary[]; page: number; limit: number }>("/docs/list", params);

export const docsDelete = (doc_id: string) => api("/docs/delete", { doc_id });

export const docsShare = (doc_id: string, password?: string, accessor_name?: string) =>
  api<DocFull>("/docs/share", { doc_id, password, accessor_name });

// Tags
export const tagsList = () => api<{ tags: { id: string; name: string }[] }>("/tags/list");
export const tagsCreate = (name: string) => api<{ id: string; name: string }>("/tags/create", { name });
export const tagsAssign = (doc_id: string, tag_id: string) => api("/tags/assign", { doc_id, tag_id });
export const tagsUnassign = (doc_id: string, tag_id: string) => api("/tags/unassign", { doc_id, tag_id });

// Grep
export const grepSearch = (q: string, tag?: string, case_sensitive?: boolean) =>
  api<{ results: { id: string; title: string; snippet: string; updated_at: string }[]; total: number }>(
    "/grep",
    { q, tag, case_sensitive: case_sensitive ? "1" : undefined }
  );

// Audit
export const auditList = (doc_id: string, page?: number, limit?: number) =>
  api<{
    entries: {
      id: string;
      accessor_name: string | null;
      accessor_type: string;
      action: string;
      ip_address: string | null;
      created_at: string;
    }[];
    page: number;
    limit: number;
  }>("/audit/list", { doc_id, page, limit });
