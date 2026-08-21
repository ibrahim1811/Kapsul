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
