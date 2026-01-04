export type Market = {
  id: string;
  question: string;
  probability: number; // normalized probability in [0,1]
  rawProbability: number; // raw price-derived probability with full precision
  volume: number; // liquidity proxy (USD)
  updatedAt: string; // ISO string
  bestBid?: number | null;
  bestAsk?: number | null;
  volume24h?: number | null;
  lastPrice?: number | null;
  assetId?: string | null; // CoinGecko id if detected
  priceUsd?: number | null;
  priceChange24h?: number | null;
  displayProbability: number; // UI-safe clamped value
  probabilityLabel: string;
  probabilityChange24h?: number | null;
  probabilityChange7d?: number | null;
  meaningfulMove?: boolean;
  confidenceScore?: number;
  confidenceLabel?: "low" | "medium" | "high";
  confidenceExplanation?: string;
  confidenceBreakdown?: {
    liquidityScore: number;
    tradeActivityScore: number;
    priceStabilityScore: number;
    spreadScore: number;
    recencyScore: number;
  };
  liquidityPercentile?: number;
  liquidityLabel?: "Thin" | "Moderate" | "Deep";
  liquidityBar?: string;
  tradeActivitySummary?: string;
  explanationContext?: ExplanationContext;
};

export type BeliefShift = {
  marketId: string;
  previousProbability: number;
  currentProbability: number;
  delta: number;
  category?: string | null;
  volume24h?: number | null;
  liquidity?: number | null;
  detectedAt: string; // ISO timestamp
};

export type StoredInsight = {
  id: string;
  marketId: string;
  shiftDetectedAt: string;
  summary: string;
  whatChanged: string[];
  whyMoved: string[];
  uncertainty: string[];
  interpretation: string;
  createdAt: string;
};

export type MarketsResponse = {
  markets: Market[];
  shifts: BeliefShift[];
};

export type ExplanationContext = {
  eventTitle: string;
  currentProbability: number;
  probabilityChange24h: number | null;
  probabilityChange7d: number | null;
  confidenceScore: number | null;
  confidenceLabel: "High" | "Medium" | "Low" | null;
  liquidityUsd: number | null;
  liquidityLabel: "Thin" | "Moderate" | "Deep" | null;
  liquidityPercentile?: number | null;
  tradeActivitySummary: string | null;
  timeToExpiry: number | null;
  relatedMarketsSummary: string | null;
};

