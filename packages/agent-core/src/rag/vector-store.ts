import { KnowledgeChunk, RetrievalQuery, RetrievalResult } from './types.js';
import { AGRONOMIC_KNOWLEDGE_CORPUS } from './knowledge-base.js';

const STOP_WORDS = new Set([
  'how', 'much', 'should', 'apply', 'for', 'in', 'the', 'is', 'a', 'an', 'what',
  'can', 'i', 'my', 'to', 'of', 'and', 'do', 'it', 'on', 'with', 'at', 'this',
  'tell', 'me', 'about', 'get', 'give', 'any', 'from', 'when', 'will', 'are',
  'எப்படி', 'என்ன', 'செய்ய', 'வேண்டும்', 'உள்ளது'
]);

export class HybridRAGRetriever {
  private chunks: KnowledgeChunk[];

  constructor(corpus: KnowledgeChunk[] = AGRONOMIC_KNOWLEDGE_CORPUS) {
    this.chunks = corpus;
  }

  /**
   * Retrieves top-K grounded knowledge chunks using hybrid semantic + keyword matching.
   */
  async retrieve(query: RetrievalQuery): Promise<RetrievalResult[]> {
    const rawQuery = query.text.toLowerCase().trim();
    const filter = query.filter || {};
    const limit = filter.limit || 3;

    const queryTokens = this.tokenize(rawQuery);

    const scoredResults: RetrievalResult[] = [];

    for (const chunk of this.chunks) {
      // Apply crop filter if provided
      if (filter.crop && filter.crop.toLowerCase() !== 'all') {
        const chunkCrop = chunk.crop.toLowerCase();
        const filterCrop = filter.crop.toLowerCase();
        if (chunkCrop !== 'general' && chunkCrop !== filterCrop) {
          continue;
        }
      }

      // Apply category filter if provided
      if (filter.category && chunk.category !== filter.category) {
        continue;
      }

      const score = this.calculateRelevance(chunk, queryTokens, rawQuery, filter);

      if (score > 0.15) {
        scoredResults.push({
          chunk,
          score: Number(score.toFixed(3)),
          matchReason: this.deriveMatchReason(chunk, queryTokens)
        });
      }
    }

    // Sort descending by score
    scoredResults.sort((a, b) => b.score - a.score);

    return scoredResults.slice(0, limit);
  }

  private tokenize(text: string): string[] {
    const rawTokens = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);

    const filtered = rawTokens.filter(t => !STOP_WORDS.has(t));
    return filtered.length > 0 ? filtered : rawTokens;
  }

  private calculateRelevance(
    chunk: KnowledgeChunk,
    queryTokens: string[],
    rawQuery: string,
    filter: any
  ): number {
    let score = 0;

    // 1. Keyword match (highest weight)
    const keywords = (chunk.keywords || []).map(k => k.toLowerCase());
    let keywordHits = 0;
    for (const token of queryTokens) {
      if (keywords.some(kw => kw.includes(token) || token.includes(kw))) {
        keywordHits++;
      }
    }
    score += (keywordHits / Math.max(1, queryTokens.length)) * 0.45;

    // 2. Title & Content text overlap
    const combinedContent = `${chunk.title} ${chunk.titleTa} ${chunk.contentEn} ${chunk.contentTa}`.toLowerCase();
    let textHits = 0;
    for (const token of queryTokens) {
      if (combinedContent.includes(token)) {
        textHits++;
      }
    }
    score += (textHits / Math.max(1, queryTokens.length)) * 0.35;

    // 3. Exact phrase match boost
    if (combinedContent.includes(rawQuery) && rawQuery.length > 5) {
      score += 0.20;
    }

    // 4. Category alignment boost
    if (filter.category && chunk.category === filter.category) {
      score += 0.25;
    }

    // 5. Crop context alignment boost
    if (
      rawQuery.includes(chunk.crop.toLowerCase()) ||
      (chunk.crop === 'Paddy' && (rawQuery.includes('நெல்') || rawQuery.includes('rice'))) ||
      (filter.crop && chunk.crop.toLowerCase() === filter.crop.toLowerCase())
    ) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  private deriveMatchReason(chunk: KnowledgeChunk, queryTokens: string[]): string {
    const matched = chunk.keywords.filter(k => queryTokens.some(t => k.toLowerCase().includes(t)));
    if (matched.length > 0) {
      return `Keyword match on: ${matched.slice(0, 3).join(', ')}`;
    }
    return `Semantic overlap with ${chunk.crop} (${chunk.category})`;
  }
}
