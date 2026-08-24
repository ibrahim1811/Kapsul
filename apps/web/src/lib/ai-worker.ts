import type { SearchableItem } from "@kapsul/types";
import { getFirebaseAuth } from "@/lib/firebase";

const WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL ?? "";

export async function triggerItemProcessing(itemId: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return;
  const token = await user.getIdToken();
  try {
    const res = await fetch(`${WORKER_URL}/process/${itemId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`triggerItemProcessing: worker returned ${res.status} for ${itemId}`);
    }
  } catch (err) {
    console.error("triggerItemProcessing: request failed", err);
  }
}

export async function searchItemsWithAI(query: string, items: SearchableItem[]): Promise<string[]> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Arama için giriş yapmalısınız.");
  const token = await user.getIdToken();

  const res = await fetch(`${WORKER_URL}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, items }),
  });

  const data = (await res.json().catch(() => null)) as { ok?: boolean; matches?: string[]; error?: string } | null;
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "AI arama başarısız oldu.");
  }
  return data.matches ?? [];
}
