export type Market = {
  id: string;
  question: string;
  probability: number; // 0-1
  volume: number; // in USD if available
  updatedAt: string; // ISO string
  bestBid?: number | null;
  bestAsk?: number | null;
  volume24h?: number | null;
  lastPrice?: number | null;
  assetId?: string | null; // CoinGecko id if detected
  priceUsd?: number | null;
  priceChange24h?: number | null;
  displayProbability?: number; // 0-1 after clamping for UI
  probabilityLabel?: string;
  confidenceScore?: number;
  confidenceLabel?: "low" | "medium" | "high";
  confidenceExplanation?: string;
  liquidityPercentile?: number;
  delta24h?: number | null;
  delta7d?: number | null;
  meaningfulMove?: boolean;
  liquidityBar?: string;
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
  liquidity: number;
  liquidityChange: number | null;
  confidenceScore: number | null;
  timeToExpiry: number | null;
  tradeActivitySummary: string | null;
  liquidityPercentile?: number | null;
};

