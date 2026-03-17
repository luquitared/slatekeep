export interface Env {
  DB: D1Database;
}

export interface User {
  id: string;
  username: string | null;
  password_hash: string;
  is_anonymous: number;
  display_name: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  label: string;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  content: string;
  password_hash: string | null;
  is_public: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
}

export interface Tag {
  id: string;
  name: string;
  user_id: string;
}

export interface AuditEntry {
  id: string;
  document_id: string;
  accessor_id: string | null;
  accessor_name: string | null;
  accessor_type: string;
  action: string;
  ip_address: string | null;
  created_at: string;
}

export interface AuthContext {
  user: User;
}

export type Handler = (
  request: Request,
  env: Env,
  params: URLSearchParams,
  auth: AuthContext | null
) => Promise<Response>;
