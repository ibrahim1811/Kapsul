import { createRemoteJWKSet, jwtVerify } from "jose";
import { GroqProvider } from "@kapsul/ai";
import type { SearchableItem } from "@kapsul/types";
import { FirestoreClient } from "./firestore";
import { runItemPipeline } from "./pipeline";

export interface Env {
  BUCKET: R2Bucket;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGIN: string;
  GROQ_API_KEY: string;
  FIRESTORE_CLIENT_EMAIL: string;
  FIRESTORE_PRIVATE_KEY: string;
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    if (request.method !== "POST") {
      return new Response("Not found", { status: 404, headers: cors });
    }

    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
    if (!token) {
      return new Response("Unauthorized", { status: 401, headers: cors });
    }

    let userId: string;
    try {
      userId = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
    } catch {
      return new Response("Unauthorized", { status: 401, headers: cors });
    }

    const processMatch = url.pathname.match(/^\/process\/([^/]+)$/);
    if (processMatch) {
      const itemId = processMatch[1];
      const firestore = new FirestoreClient(env.FIREBASE_PROJECT_ID, {
        client_email: env.FIRESTORE_CLIENT_EMAIL,
        private_key: env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });

      try {
        await runItemPipeline(firestore, userId, itemId, env.BUCKET, env.GROQ_API_KEY);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "İşlem başarısız." }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    if (url.pathname === "/search") {
      return handleSearch(request, env, cors);
    }

    if (url.pathname === "/ask") {
      return handleAsk(request, env, cors);
    }

    return new Response("Not found", { status: 404, headers: cors });
  },
};

async function handleSearch(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  let body: { query?: unknown; items?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Geçersiz istek gövdesi." }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const items = Array.isArray(body.items) ? (body.items as SearchableItem[]).slice(0, 500) : [];

  if (!query || items.length === 0) {
    return new Response(JSON.stringify({ ok: true, matches: [] }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const matches = await new GroqProvider(env.GROQ_API_KEY).searchItems(query, items);
    return new Response(JSON.stringify({ ok: true, matches }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Arama başarısız." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
}

const MAX_ASK_CONTEXT_LENGTH = 24000;

async function handleAsk(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  let body: { question?: unknown; context?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Geçersiz istek gövdesi." }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const context = typeof body.context === "string" ? body.context.slice(0, MAX_ASK_CONTEXT_LENGTH) : "";

  if (!question) {
    return new Response(JSON.stringify({ ok: false, error: "Soru boş olamaz." }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const answer = await new GroqProvider(env.GROQ_API_KEY).answerQuestion(question, context);
    return new Response(JSON.stringify({ ok: true, answer }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Cevaplama başarısız." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
}
