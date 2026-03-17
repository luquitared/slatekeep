import { Env } from "./types";
import { handleApiRequest } from "./router";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    // Static assets are handled by Cloudflare Workers Assets (wrangler.jsonc assets config)
    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
