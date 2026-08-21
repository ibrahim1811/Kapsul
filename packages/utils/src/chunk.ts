export type TextChunk = {
  text: string;
  index: number;
};

export function splitIntoChunks(
  text: string,
  maxChars = 1500,
  overlapChars = 200
): TextChunk[] {
  const normalized = text.trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [{ text: normalized, index: 0 }];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxChars, normalized.length);
    chunks.push({ text: normalized.slice(start, end), index });
    index += 1;
    if (end === normalized.length) break;
    start = end - overlapChars;
  }

  return chunks;
}
