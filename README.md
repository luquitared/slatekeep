# SlateKeep

A full-stack app for sharing memories and documents with AI agents and chatbots. Built on Cloudflare Workers + D1 with a React frontend.

## Features

- **Markdown documents** with live preview editor
- **API key auth** for AI agents and chatbots (`sk_` prefixed keys)
- **Password-protected documents** with PBKDF2 hashing
- **Public sharing** with optional password gate
- **Full-text search** across all documents
- **Tagging system** for organizing documents
- **Audit log** tracking every document access (who, when, IP)
- **Anonymous sign-in** for quick access
- **All GET API** — every endpoint uses query parameters, no request bodies

## Tech Stack

- **Backend:** Cloudflare Workers (TypeScript)
- **Database:** Cloudflare D1 (SQLite)
- **Frontend:** React + Vite + react-markdown
- **Auth:** PBKDF2 via Web Crypto API (zero external deps)

## Project Structure

```
slatekeep/
├── wrangler.jsonc              # Cloudflare Workers config
├── migrations/0001_initial.sql # D1 database schema
├── src/
│   ├── worker/
│   │   ├── index.ts            # Worker entrypoint
│   │   ├── router.ts           # GET-only route map
│   │   ├── auth.ts             # Hashing, sessions, API key validation
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── handlers/           # Route handlers
│   │       ├── auth.handlers.ts
│   │       ├── documents.handlers.ts
│   │       ├── tags.handlers.ts
│   │       ├── grep.handlers.ts
│   │       ├── audit.handlers.ts
│   │       └── docs.handler.ts # GET /api/docs — markdown API reference
│   └── client/
│       ├── index.html / main.tsx / App.tsx
│       ├── api.ts              # Fetch wrappers for all endpoints
│       ├── auth.tsx            # Auth context (localStorage session)
│       ├── pages/              # Login, Register, Dashboard, Editor, View, Audit, Settings, Shared
│       └── components/         # Navbar, MarkdownEditor, TagInput
└── dist/                       # Built frontend (gitignored)
```

## Local Development

### Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A Cloudflare account (for deployment)

### Setup

```bash
# Install dependencies
npm install

# Apply the D1 migration locally
npm run migrate:local

# Start the Workers backend (port 8787)
npm run dev

# In another terminal, start the Vite frontend (port 5173, proxies /api/ to 8787)
npx vite dev
```

Open http://localhost:5173

## Deployment

### First-time setup

1. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

2. **Create the D1 database:**
   ```bash
   wrangler d1 create slatekeep-db
   ```

3. **Update `wrangler.jsonc`** with your values:
   - Set `account_id` to your Cloudflare account ID
   - Set `database_id` to the ID returned from step 2
   - Optionally add custom domain routes:
     ```jsonc
     "routes": [
       { "pattern": "yourdomain.com", "custom_domain": true }
     ]
     ```

4. **Run the migration on production:**
   ```bash
   npm run migrate:remote
   ```

5. **Deploy:**
   ```bash
   npm run deploy
   ```

### Subsequent deploys

```bash
npm run deploy
```

This builds the frontend with Vite and deploys everything (worker + static assets) to Cloudflare.

### Custom domain

To connect a custom domain, make sure the domain's DNS is managed by Cloudflare (nameservers pointed to Cloudflare), then add it to the `routes` array in `wrangler.jsonc`:

```jsonc
"routes": [
  { "pattern": "yourdomain.com", "custom_domain": true },
  { "pattern": "www.yourdomain.com", "custom_domain": true }
]
```

Then redeploy with `npm run deploy`. Cloudflare provisions the SSL certificate automatically.

### Database migrations

To apply new migrations:

```bash
# Local
wrangler d1 execute slatekeep-db --local --file=migrations/XXXX_name.sql

# Production
wrangler d1 execute slatekeep-db --remote --file=migrations/XXXX_name.sql
```

## API Reference

The full API reference is served as markdown at:

```
GET /api/docs
```

You can give this URL directly to an AI agent. All endpoints are GET with query parameters.

### Quick overview

| Area | Endpoints |
|------|-----------|
| Auth | `/api/auth/register`, `/api/auth/login`, `/api/auth/anonymous`, `/api/auth/me`, `/api/auth/logout` |
| API Keys | `/api/keys/create`, `/api/keys/list`, `/api/keys/delete` |
| Documents | `/api/docs/create`, `/api/docs/update`, `/api/docs/get`, `/api/docs/list`, `/api/docs/delete`, `/api/docs/share` |
| Tags | `/api/tags/list`, `/api/tags/create`, `/api/tags/assign`, `/api/tags/unassign` |
| Search | `/api/grep` |
| Audit | `/api/audit/list` |

### Giving an agent access

1. Register and log in
2. Go to **Settings** and create an API key
3. Give the agent the API key and the docs URL (`https://yourdomain.com/api/docs`)

The agent can then use `api_key=sk_...` as a query parameter on any endpoint.
