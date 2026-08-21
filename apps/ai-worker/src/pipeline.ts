import { GroqProvider } from "@kapsul/ai";
import type { Item, ItemMetadata } from "@kapsul/types";
import { sha256Hex } from "@kapsul/utils";
import { extractItemText } from "./extract";
import { FirestoreClient } from "./firestore";

/** Dosyadan/metinden ham içeriği çıkarır, `extractedText` + `processingStatus`'u günceller. */
export async function runExtraction(
  fs: FirestoreClient,
  userId: string,
  itemId: string,
  bucket: R2Bucket,
  groqApiKey: string
): Promise<Item | undefined> {
  const item = await fs.getItem(userId, itemId);
  if (!item) return undefined;

  await fs.updateItem(userId, itemId, { processingStatus: "processing" });

  try {
    const extracted = await extractItemText(item, bucket, groqApiKey);
    await fs.updateItem(userId, itemId, {
      extractedText: extracted.text,
      contentHash: sha256Hex(extracted.text || itemId),
      processingStatus: "completed",
      ...(extracted.metadata ? { metadata: { ...item.metadata, ...extracted.metadata } } : {}),
    });
    return { ...item, extractedText: extracted.text };
  } catch (err) {
    await fs.updateItem(userId, itemId, {
      processingStatus: "failed",
      processingError: err instanceof Error ? err.message : "Bilinmeyen çıkarma hatası.",
    });
    return undefined;
  }
}

/** `extractedText` üzerinden Groq analizi çalıştırır, özet/etiket/metadata'yı günceller. */
export async function runAnalysis(
  fs: FirestoreClient,
  userId: string,
  itemId: string,
  groqApiKey: string
): Promise<void> {
  const item = await fs.getItem(userId, itemId);
  if (!item) return;
  if (!item.extractedText?.trim()) {
    await fs.updateItem(userId, itemId, { aiStatus: "completed" });
    return;
  }

  await fs.updateItem(userId, itemId, { aiStatus: "processing" });

  try {
    const analysis = await new GroqProvider(groqApiKey).analyzeContent(item.extractedText);
    const metadata: ItemMetadata = {
      ...item.metadata,
      language: analysis.language || undefined,
      dates: analysis.dates,
      people: analysis.people,
      organizations: analysis.organizations,
      locations: analysis.locations,
      amounts: analysis.amounts,
      actionItems: analysis.actionItems,
    };
    await fs.updateItem(userId, itemId, {
      summary: analysis.summary || undefined,
      category: analysis.category || undefined,
      tags: Array.from(new Set([...(item.tags ?? []), ...analysis.tags])),
      metadata,
      aiStatus: "completed",
    });
  } catch (err) {
    await fs.updateItem(userId, itemId, {
      aiStatus: "failed",
      processingError: err instanceof Error ? err.message : "AI analiz hatası.",
    });
  }
}

export async function runItemPipeline(
  fs: FirestoreClient,
  userId: string,
  itemId: string,
  bucket: R2Bucket,
  groqApiKey: string
): Promise<void> {
  const extracted = await runExtraction(fs, userId, itemId, bucket, groqApiKey);
  if (!extracted) return;
  await runAnalysis(fs, userId, itemId, groqApiKey);
}
