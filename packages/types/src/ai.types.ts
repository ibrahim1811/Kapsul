export type AIAnalysisResult = {
  title: string;
  summary: string;
  category: string;
  tags: string[];
  folder: string;
  language: string;
  dates: string[];
  people: string[];
  organizations: string[];
  locations: string[];
  amounts: string[];
  actionItems: string[];
  importantPoints: string[];
};

export type AIProviderName = "groq";

export type SearchableItem = {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  tags: string[];
  people?: string[];
  organizations?: string[];
  locations?: string[];
  amounts?: string[];
  actionItems?: string[];
};
