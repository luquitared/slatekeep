const DOCS_MD = `# SlateKeep API Reference

All endpoints are **GET** requests with query parameters. Responses are JSON.

## Authentication

Every endpoint (except \`/api/auth/register\`, \`/api/auth/login\`, \`/api/auth/anonymous\`, and \`/api/docs/share\`) requires one of:
- \`session\` — session token from login/register
- \`api_key\` — API key (prefix \`sk_\`)

---

## Auth

### Register
\`\`\`
GET /api/auth/register?username=<str>&password=<str>&display_name=<str>
\`\`\`
Returns: \`{ session, user_id, username, display_name }\`

### Login
\`\`\`
GET /api/auth/login?username=<str>&password=<str>
\`\`\`
Returns: \`{ session, user_id, username, display_name }\`

### Anonymous Sign-In
\`\`\`
GET /api/auth/anonymous
\`\`\`
Returns: \`{ session, user_id, display_name, is_anonymous }\`

### Get Current User
\`\`\`
GET /api/auth/me?session=<token>
\`\`\`
Returns: \`{ id, username, display_name, is_anonymous, created_at }\`

### Logout
\`\`\`
GET /api/auth/logout?session=<token>
\`\`\`
Returns: \`{ ok: true }\`

---

## API Keys

### Create Key
\`\`\`
GET /api/keys/create?session=<token>&label=<str>
\`\`\`
Returns: \`{ id, key, key_prefix, label }\`
> The \`key\` field is the raw API key — it is only shown once.

### List Keys
\`\`\`
GET /api/keys/list?session=<token>
\`\`\`
Returns: \`{ keys: [{ id, key_prefix, label, created_at }] }\`

### Delete Key
\`\`\`
GET /api/keys/delete?session=<token>&key_id=<str>
\`\`\`
Returns: \`{ ok: true }\`

---

## Documents

### Create Document
\`\`\`
GET /api/docs/create?session|api_key&title=<str>&content=<str>&password=<str>&is_public=0|1&tags=<comma,separated>
\`\`\`
Returns: \`{ id, title, is_public }\`

### Update Document
\`\`\`
GET /api/docs/update?session|api_key&doc_id=<str>&title=<str>&content=<str>&password=<str>&is_public=0|1
\`\`\`
Returns: \`{ ok: true }\`

### Get Document (owner)
\`\`\`
GET /api/docs/get?session|api_key&doc_id=<str>&accessor_name=<str>
\`\`\`
Returns: \`{ id, user_id, title, content, is_public, has_password, created_at, updated_at, last_accessed_at, tags: [{ id, name }] }\`
> Logs an audit entry.

### List Documents
\`\`\`
GET /api/docs/list?session|api_key&tag=<str>&page=<int>&limit=<int>
\`\`\`
Returns: \`{ documents: [{ id, title, is_public, has_password, created_at, updated_at, tags }], page, limit }\`

### Delete Document
\`\`\`
GET /api/docs/delete?session|api_key&doc_id=<str>
\`\`\`
Returns: \`{ ok: true }\`

### Share (public access, no auth required)
\`\`\`
GET /api/docs/share?doc_id=<str>&password=<str>&accessor_name=<str>
\`\`\`
Returns: \`{ id, title, content, is_public, has_password, created_at, updated_at, tags }\`
> Only works if the document has \`is_public=1\`. If the document has a password, the \`password\` param is required. Logs an audit entry with the \`accessor_name\`.

---

## Tags

### List Tags
\`\`\`
GET /api/tags/list?session|api_key
\`\`\`
Returns: \`{ tags: [{ id, name }] }\`

### Create Tag
\`\`\`
GET /api/tags/create?session|api_key&name=<str>
\`\`\`
Returns: \`{ id, name }\`

### Assign Tag to Document
\`\`\`
GET /api/tags/assign?session|api_key&doc_id=<str>&tag_id=<str>
\`\`\`
Returns: \`{ ok: true }\`

### Unassign Tag from Document
\`\`\`
GET /api/tags/unassign?session|api_key&doc_id=<str>&tag_id=<str>
\`\`\`
Returns: \`{ ok: true }\`

---

## Search

### Grep (full-text search)
\`\`\`
GET /api/grep?session|api_key&q=<str>&tag=<str>&case_sensitive=0|1
\`\`\`
Returns: \`{ results: [{ id, title, snippet, updated_at }], total }\`

---

## Audit Log

### List Audit Entries
\`\`\`
GET /api/audit/list?session|api_key&doc_id=<str>&page=<int>&limit=<int>
\`\`\`
Returns: \`{ entries: [{ id, accessor_name, accessor_type, action, ip_address, created_at }], page, limit }\`

---

## Notes

- All IDs are hex strings.
- Dates are ISO 8601 strings (UTC).
- \`session|api_key\` means provide either \`session=<token>\` or \`api_key=sk_...\` as a query param.
- Passwords are hashed server-side with PBKDF2 (100k iterations, SHA-256).
- The \`content\` field in documents is raw Markdown.
`;

export function docs(): Response {
  return new Response(DOCS_MD, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
