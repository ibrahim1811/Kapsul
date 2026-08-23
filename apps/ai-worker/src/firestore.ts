import { SignJWT, importPKCS8 } from "jose";
import { itemsCollectionPath, userDocPath } from "@kapsul/api";
import type { Item } from "@kapsul/types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/datastore";

export type ServiceAccount = { client_email: string; private_key: string };

type FirestoreValue =
  | { nullValue: null }
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

function toValue(v: unknown): FirestoreValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (val !== undefined) fields[k] = toValue(val);
  }
  return { mapValue: { fields } };
}

function fromValue(v: FirestoreValue | undefined): unknown {
  if (!v) return undefined;
  if ("nullValue" in v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(fromValue);
  if ("mapValue" in v) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) out[k] = fromValue(val);
    return out;
  }
  return undefined;
}

function toFields(patch: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) fields[k] = toValue(v);
  }
  return fields;
}

let cachedToken: { value: string; expiresAt: number } | undefined;

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 30) return cachedToken.value;

  const key = await importPKCS8(sa.private_key, "RS256");
  const jwt = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Servis hesabı token alınamadı (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
}

export class FirestoreClient {
  constructor(
    private readonly projectId: string,
    private readonly serviceAccount: ServiceAccount
  ) {}

  private baseUrl(): string {
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  private async authHeader(): Promise<Record<string, string>> {
    const token = await getAccessToken(this.serviceAccount);
    return { Authorization: `Bearer ${token}` };
  }

  async getItem(userId: string, itemId: string): Promise<Item | undefined> {
    const path = `${itemsCollectionPath(userId)}/${itemId}`;
    const res = await fetch(`${this.baseUrl()}/${path}`, { headers: await this.authHeader() });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`Firestore okuma hatası (${res.status}): ${await res.text()}`);
    const doc = (await res.json()) as { fields?: Record<string, FirestoreValue> };
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc.fields ?? {})) out[k] = fromValue(v);
    return out as Item;
  }

  async updateItem(userId: string, itemId: string, patch: Record<string, unknown>): Promise<void> {
    const path = `${itemsCollectionPath(userId)}/${itemId}`;
    const withTimestamp = { ...patch, updatedAt: new Date().toISOString() };
    const mask = Object.keys(withTimestamp)
      .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
      .join("&");
    const res = await fetch(`${this.baseUrl()}/${path}?${mask}`, {
      method: "PATCH",
      headers: { ...(await this.authHeader()), "Content-Type": "application/json" },
      body: JSON.stringify({ fields: toFields(withTimestamp) }),
    });
    if (!res.ok) throw new Error(`Firestore güncelleme hatası (${res.status}): ${await res.text()}`);
  }

  /** Kullanıcının tüm öğelerindeki etiketleri toplayıp tekilleştirir (AI'ın var olan etiketleri tercih etmesi için). */
  async listAllTags(userId: string): Promise<string[]> {
    const res = await fetch(`${this.baseUrl()}/${userDocPath(userId)}:runQuery`, {
      method: "POST",
      headers: { ...(await this.authHeader()), "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          select: { fields: [{ fieldPath: "tags" }] },
          from: [{ collectionId: "items" }],
        },
      }),
    });
    if (!res.ok) throw new Error(`Firestore sorgu hatası (${res.status}): ${await res.text()}`);
    const rows = (await res.json()) as Array<{ document?: { fields?: Record<string, FirestoreValue> } }>;

    const tags = new Set<string>();
    for (const row of rows) {
      const raw = row.document?.fields?.tags;
      if (!raw) continue;
      for (const t of fromValue(raw) as unknown[]) {
        if (typeof t === "string" && t.trim()) tags.add(t.trim());
      }
    }
    return Array.from(tags);
  }
}
