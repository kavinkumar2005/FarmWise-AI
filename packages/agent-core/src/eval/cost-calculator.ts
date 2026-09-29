/**
 * FarmwiseAI Cost & Latency Analytics Calculator
 * Quantifies economic and performance advantages of multi-model routing over monolithic LLM approaches.
 */

export interface ModelUsageBreakdown {
  model: string;
  provider: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  imagesProcessed: number;
  costUSD: number;
  avgLatencyMs: number;
}

export interface ArchitectureCostComparison {
  monolithic: {
    name: string;
    costPerRunUSD: number;
    avgLatencyMs: number;
    monthlyCostUSD: number;
    description: string;
  };
  multiModel: {
    name: string;
    costPerRunUSD: number;
    avgLatencyMs: number;
    monthlyCostUSD: number;
    description: string;
    modelBreakdown: ModelUsageBreakdown[];
  };
  savings: {
    costSavingsPct: number;
    costSavingsUSDPer10kRuns: number;
    latencyReductionPct: number;
    monthlySavingsUSD: number;
    awsBudgetUtilizationPct: number; // Against USD 100 event budget
  };
}

export class CostAnalyticsCalculator {
  /**
   * Calculates comprehensive cost and latency comparisons based on monthly query volume.
   * @param monthlyQueries Number of farmer requests per month (default: 10,000)
   */
  static calculateComparison(monthlyQueries: number = 10000): ArchitectureCostComparison {
    // 1. Monolithic Claude 3.5 Sonnet / Gemini Pro baseline
    // Every plan step, vision inspection, knowledge retrieval, and verification handled by frontier model
    const monolithicCostPerRun = 0.0168; // 4k input ($0.012) + 1 image ($0.0048)
    const monolithicLatencyMs = 3200;
    const monolithicMonthly = Number((monolithicCostPerRun * monthlyQueries).toFixed(2));

    // 2. FarmwiseAI Multi-Model Routing
    const modelBreakdown: ModelUsageBreakdown[] = [
      {
        model: 'ministral-8b',
        provider: 'AWS Bedrock (ap-south-1)',
        calls: 2,
        inputTokens: 1200,
        outputTokens: 400,
        imagesProcessed: 0,
        costUSD: 0.00016,
        avgLatencyMs: 750
      },
      {
        model: 'titan-multimodal-embed',
        provider: 'AWS Bedrock (ap-south-1)',
        calls: 1,
        inputTokens: 0,
        outputTokens: 0,
        imagesProcessed: 1,
        costUSD: 0.0008,
        avgLatencyMs: 350
      },
      {
        model: 'gemini-1.5-flash',
        provider: 'Google API',
        calls: 1,
        inputTokens: 800,
        outputTokens: 300,
        imagesProcessed: 1,
        costUSD: 0.00017,
        avgLatencyMs: 1100
      },
      {
        model: 'claude-3-5-sonnet',
        provider: 'Anthropic (Escalation / Critic only)',
        calls: 0.35, // Escalated for ~35% of ambiguous cases / anomalies
        inputTokens: 450,
        outputTokens: 150,
        imagesProcessed: 0,
        costUSD: 0.0024,
        avgLatencyMs: 900
      }
    ];

    const multiModelCostPerRun = Number(
      modelBreakdown.reduce((sum, item) => sum + item.costUSD, 0).toFixed(5)
    );
    const multiModelLatencyMs = 1650; // Parallel execution + cheap fast models
    const multiModelMonthly = Number((multiModelCostPerRun * monthlyQueries).toFixed(2));

    // 3. Compute Savings & Metrics
    const costSavingsPct = Number(
      (((monolithicCostPerRun - multiModelCostPerRun) / monolithicCostPerRun) * 100).toFixed(1)
    );
    const latencyReductionPct = Number(
      (((monolithicLatencyMs - multiModelLatencyMs) / monolithicLatencyMs) * 100).toFixed(1)
    );
    const monthlySavingsUSD = Number((monolithicMonthly - multiModelMonthly).toFixed(2));
    const costSavingsUSDPer10kRuns = Number(
      ((monolithicCostPerRun - multiModelCostPerRun) * 10000).toFixed(2)
    );

    // Event budget: USD 100
    const awsBudgetUSD = 100;
    const awsBudgetUtilizationPct = Number(((multiModelMonthly / awsBudgetUSD) * 100).toFixed(1));

    return {
      monolithic: {
        name: 'Monolithic Frontier LLM (Claude 3.5 Sonnet / Gemini Pro)',
        costPerRunUSD: monolithicCostPerRun,
        avgLatencyMs: monolithicLatencyMs,
        monthlyCostUSD: monolithicMonthly,
        description: 'Sends all steps (planning, vision, extraction, advisory, verification) to frontier LLMs without routing.'
      },
      multiModel: {
        name: 'FarmwiseAI Agentic Multi-Model Routing',
        costPerRunUSD: multiModelCostPerRun,
        avgLatencyMs: multiModelLatencyMs,
        monthlyCostUSD: multiModelMonthly,
        description: 'Routes open-weight Ministral 8B on Bedrock, Titan image embeddings, Gemini Flash for vision, and reserves Claude Sonnet for verification critic.',
        modelBreakdown
      },
      savings: {
        costSavingsPct,
        costSavingsUSDPer10kRuns,
        latencyReductionPct,
        monthlySavingsUSD,
        awsBudgetUtilizationPct
      }
    };
  }
}
