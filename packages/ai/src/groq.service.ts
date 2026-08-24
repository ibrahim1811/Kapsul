import Groq from "groq-sdk";
import type { AIAnalysisResult, SearchableItem } from "@kapsul/types";
import type { AIProvider } from "./ai-provider.interface";
import { buildAnalyzeItemPrompt } from "./prompts/analyze-item.prompt";
import { buildAnswerQuestionPrompt } from "./prompts/answer-question.prompt";
import { buildSearchItemsPrompt } from "./prompts/search-items.prompt";

// llama-3.3-70b-versatile Groq tarafından Ağustos 2026'da kaldırıldı; önerilen yerine geçen model kullanılıyor.
const DEFAULT_MODEL = "openai/gpt-oss-120b";

const EMPTY_ANALYSIS: AIAnalysisResult = {
  title: "",
  summary: "",
  category: "",
  tags: [],
  folder: "",
  language: "",
  dates: [],
  people: [],
  organizations: [],
  locations: [],
  amounts: [],
  actionItems: [],
  importantPoints: [],
};

function parseAnalysisJson(raw: string): AIAnalysisResult {
  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const jsonSlice = jsonStart >= 0 && jsonEnd >= jsonStart ? raw.slice(jsonStart, jsonEnd + 1) : raw;
    const parsed = JSON.parse(jsonSlice);
    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      category: typeof parsed.category === "string" ? parsed.category : "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: unknown) => typeof t === "string") : [],
      folder: typeof parsed.folder === "string" ? parsed.folder : "",
      language: typeof parsed.language === "string" ? parsed.language : "",
      dates: Array.isArray(parsed.dates) ? parsed.dates : [],
      people: Array.isArray(parsed.people) ? parsed.people : [],
      organizations: Array.isArray(parsed.organizations) ? parsed.organizations : [],
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      amounts: Array.isArray(parsed.amounts) ? parsed.amounts : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      importantPoints: Array.isArray(parsed.importantPoints) ? parsed.importantPoints : [],
    };
  } catch {
    return { ...EMPTY_ANALYSIS };
  }
}

export class GroqProvider implements AIProvider {
  private client: Groq;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("GROQ_API_KEY is required to initialize GroqProvider.");
    this.client = new Groq({ apiKey });
  }

  async analyzeContent(
    text: string,
    existingTags: string[] = [],
    existingFolders: string[] = []
  ): Promise<AIAnalysisResult> {
    const completion = await this.client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "user", content: buildAnalyzeItemPrompt(text, existingTags, existingFolders) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_completion_tokens: 4096,
      reasoning_format: "hidden",
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    if (!raw) return { ...EMPTY_ANALYSIS };
    return parseAnalysisJson(raw);
  }

  async answerQuestion(question: string, context: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: buildAnswerQuestionPrompt(question, context) }],
      temperature: 0.1,
    });

    return (
      completion.choices[0]?.message?.content ??
      "Kaydettiğin içeriklerde bu soruyu kesin olarak cevaplayacak yeterli bilgi bulamadım."
    );
  }

  async searchItems(query: string, items: SearchableItem[]): Promise<string[]> {
    if (items.length === 0) return [];

    const completion = await this.client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: buildSearchItemsPrompt(query, items) }],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_completion_tokens: 2048,
      reasoning_format: "hidden",
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    if (!raw) return [];

    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      const jsonSlice = jsonStart >= 0 && jsonEnd >= jsonStart ? raw.slice(jsonStart, jsonEnd + 1) : raw;
      const parsed = JSON.parse(jsonSlice);
      const matches: unknown = parsed.matches;
      if (!Array.isArray(matches)) return [];
      const validIds = new Set(items.map((item) => item.id));
      return matches.filter((id): id is string => typeof id === "string" && validIds.has(id));
    } catch {
      return [];
    }
  }
}
