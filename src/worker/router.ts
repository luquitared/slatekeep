import { Env } from "./types";
import { error } from "./auth";
import * as authHandlers from "./handlers/auth.handlers";
import * as docHandlers from "./handlers/documents.handlers";
import * as tagHandlers from "./handlers/tags.handlers";
import * as grepHandlers from "./handlers/grep.handlers";
import * as auditHandlers from "./handlers/audit.handlers";
import { docs as apiDocs } from "./handlers/docs.handler";

type RouteHandler = (
  request: Request,
  env: Env,
  params: URLSearchParams
) => Promise<Response>;

const routes: Record<string, RouteHandler> = {
  "/api/auth/register": authHandlers.register,
  "/api/auth/login": authHandlers.login,
  "/api/auth/anonymous": authHandlers.anonymous,
  "/api/auth/me": authHandlers.me,
  "/api/auth/logout": authHandlers.logout,

  "/api/keys/create": authHandlers.keysCreate,
  "/api/keys/list": authHandlers.keysList,
  "/api/keys/delete": authHandlers.keysDelete,

  "/api/docs/create": docHandlers.create,
  "/api/docs/update": docHandlers.update,
  "/api/docs/get": docHandlers.get,
  "/api/docs/list": docHandlers.list,
  "/api/docs/delete": docHandlers.del,
  "/api/docs/share": docHandlers.share,

  "/api/tags/list": tagHandlers.list,
  "/api/tags/create": tagHandlers.create,
  "/api/tags/assign": tagHandlers.assign,
  "/api/tags/unassign": tagHandlers.unassign,

  "/api/grep": grepHandlers.grep,

  "/api/audit/list": auditHandlers.list,
};

export function handleApiRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/api/docs") return Promise.resolve(apiDocs());
  const handler = routes[url.pathname];
  if (!handler) return Promise.resolve(error("not found", 404));
  return handler(request, env, url.searchParams);
}
