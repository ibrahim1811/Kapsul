import { createRemoteJWKSet, jwtVerify } from "jose";

export interface Env {
  BUCKET: R2Bucket;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGIN: string;
  SERVICE_TOKEN?: string;
}

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

async function verifyFirebaseToken(token: string, projectId: string): Promise<string> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  if (typeof payload.sub !== "string") throw new Error("invalid subject");
  return payload.sub;
}

function corsHeaders(requestOrigin: string | null, allowedOrigins: string): HeadersInit {
  const allowed = allowedOrigins.split(",").map((o) => o.trim());
  const origin = requestOrigin && allowed.includes(requestOrigin) ? requestOrigin : allowed[0];
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request.headers.get("origin"), env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/files\/([^/]+)\/(.+)$/);
    if (!match) {
      return new Response("Not found", { status: 404, headers: cors });
    }
    const [, userId, rest] = match;
    const key = `users/${userId}/files/${rest}`;

    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
    if (!token) {
      return new Response("Unauthorized", { status: 401, headers: cors });
    }

    const isServiceCall =
      request.method === "GET" && !!env.SERVICE_TOKEN && token === env.SERVICE_TOKEN;

    if (!isServiceCall) {
      let uid: string;
      try {
        uid = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
      } catch {
        return new Response("Unauthorized", { status: 401, headers: cors });
      }
      if (uid !== userId) {
        return new Response("Forbidden", { status: 403, headers: cors });
      }
    }

    if (request.method === "PUT") {
      await env.BUCKET.put(key, request.body, {
        httpMetadata: { contentType: request.headers.get("content-type") ?? undefined },
      });
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === "GET") {
      const object = await env.BUCKET.get(key);
      if (!object) return new Response("Not found", { status: 404, headers: cors });
      const headers = new Headers(cors);
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      return new Response(object.body, { headers });
    }

    if (request.method === "DELETE") {
      await env.BUCKET.delete(key);
      return new Response(null, { status: 204, headers: cors });
    }

    return new Response("Method not allowed", { status: 405, headers: cors });
  },
};
