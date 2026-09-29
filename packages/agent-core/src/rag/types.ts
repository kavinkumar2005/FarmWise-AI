import { ProvenanceSource } from '../schemas/index.js';

export type AgriCategory = 'fertilizer' | 'pest_control' | 'irrigation' | 'weather_action' | 'scheme' | 'general';

export interface KnowledgeChunk {
  chunkId: string;
  crop: string; // e.g. 'Paddy', 'Groundnut', 'Cotton', 'Coconut', 'Sugarcane', 'General'
  growthStage?: string; // e.g. 'Nursery', 'Tillering', 'Flowering', 'Maturity', 'All'
  category: AgriCategory;
  title: string;
  titleTa: string;
  contentEn: string;
  contentTa: string;
  keywords: string[];
  embedding?: number[]; // 1024-dim Titan Text Embeddings V2 vector (when available)
  sourceCitation: {
    sourceId: string;
    title: string;
    section: string;
    provenance: ProvenanceSource;
  };
  safetyRules?: {
    approvedChemicals?: string[];
    maxDosagePerAcre?: string;
    prohibitedChemicals?: string[];
    precautions?: string;
  };
}

export interface RAGSearchFilter {
  crop?: string;
  growthStage?: string;
  category?: AgriCategory;
  limit?: number;
}

export interface RetrievalResult {
  chunk: KnowledgeChunk;
  score: number; // 0 to 1
  matchReason: string;
}

export interface RetrievalQuery {
  text: string;
  language?: 'ta' | 'en';
  filter?: RAGSearchFilter;
}
