import Groq from "groq-sdk";
import { extractText as unpdfExtractText, getDocumentProxy } from "unpdf";
import type { Item, ItemMetadata } from "@kapsul/types";

export type ExtractResult = { text: string; metadata?: Partial<ItemMetadata> };

type ExtractableItem = Pick<Item, "type" | "storagePath" | "originalFileName" | "extractedText">;

// Groq'un görsel/ses destekli model isimleri zaman içinde değişebilir; hata alırsan
// güncel model listesini console.groq.com/docs/models üzerinden kontrol et.
const VISION_MODEL = "qwen/qwen3.6-27b";
const AUDIO_MODEL = "whisper-large-v3-turbo";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchFile(storagePath: string, bucket: R2Bucket) {
  const object = await bucket.get(storagePath);
  if (!object) throw new Error(`Dosya bulunamadı: ${storagePath}`);
  const buffer = new Uint8Array(await object.arrayBuffer());
  const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";
  return { buffer, contentType };
}

export async function extractItemText(
  item: ExtractableItem,
  bucket: R2Bucket,
  groqApiKey: string
): Promise<ExtractResult> {
  switch (item.type) {
    case "note":
    case "text":
      return extractPlainText(item, bucket);
    case "pdf":
      return extractPdf(item, bucket);
    case "image":
      return extractImage(item, bucket, groqApiKey);
    case "audio":
      return extractAudio(item, bucket, groqApiKey);
    default:
      throw new Error("Bu dosya türü için içerik çıkarma henüz desteklenmiyor.");
  }
}

async function extractPlainText(item: ExtractableItem, bucket: R2Bucket): Promise<ExtractResult> {
  if (!item.storagePath) return { text: item.extractedText ?? "" };
  const { buffer } = await fetchFile(item.storagePath, bucket);
  return { text: new TextDecoder("utf-8").decode(buffer) };
}

async function extractPdf(item: ExtractableItem, bucket: R2Bucket): Promise<ExtractResult> {
  if (!item.storagePath) throw new Error("PDF dosyası bulunamadı.");
  const { buffer } = await fetchFile(item.storagePath, bucket);
  const pdf = await getDocumentProxy(buffer);
  const { text, totalPages } = await unpdfExtractText(pdf, { mergePages: true });
  return { text, metadata: { pageCount: totalPages } };
}

async function extractImage(item: ExtractableItem, bucket: R2Bucket, groqApiKey: string): Promise<ExtractResult> {
  if (!item.storagePath) throw new Error("Görsel dosyası bulunamadı.");
  const { buffer, contentType } = await fetchFile(item.storagePath, bucket);
  const base64 = bytesToBase64(buffer);

  const completion = await new Groq({ apiKey: groqApiKey }).chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Bu görselin içeriğini Türkçe olarak ayrıntılı şekilde açıkla: görünen tüm metinleri birebir aktar, önemli nesneleri/kişileri/sahneyi tarif et.",
          },
          { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } },
        ],
      },
    ],
    temperature: 0.2,
  });

  return { text: completion.choices[0]?.message?.content ?? "" };
}

async function extractAudio(item: ExtractableItem, bucket: R2Bucket, groqApiKey: string): Promise<ExtractResult> {
  if (!item.storagePath || !item.originalFileName) throw new Error("Ses dosyası bulunamadı.");
  const { buffer, contentType } = await fetchFile(item.storagePath, bucket);
  const file = new File([buffer], item.originalFileName, { type: contentType });

  const transcription = await new Groq({ apiKey: groqApiKey }).audio.transcriptions.create({
    file,
    model: AUDIO_MODEL,
  });

  return { text: transcription.text };
}
