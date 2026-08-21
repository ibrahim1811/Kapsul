import type { AIAnalysisResult } from "@kapsul/types";

export type AIProvider = {
  analyzeContent(text: string): Promise<AIAnalysisResult>;
  answerQuestion(question: string, context: string): Promise<string>;
};
