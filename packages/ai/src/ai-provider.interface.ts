import type { AIAnalysisResult, SearchableItem } from "@kapsul/types";

export type AIProvider = {
  analyzeContent(
    text: string,
    existingTags?: string[],
    existingFolders?: string[]
  ): Promise<AIAnalysisResult>;
  answerQuestion(question: string, context: string): Promise<string>;
  searchItems(query: string, items: SearchableItem[]): Promise<string[]>;
};
