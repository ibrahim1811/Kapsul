import type { AIProvider } from "./ai-provider.interface";
import { GroqProvider } from "./groq.service";

let providerInstance: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    const apiKey = process.env.GROQ_API_KEY ?? "";
    providerInstance = new GroqProvider(apiKey);
  }
  return providerInstance;
}
