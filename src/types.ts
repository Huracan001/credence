export type Market = {
  id: string;
  question: string;
  probability: number; // 0-1
  volume: number; // in USD if available
  updatedAt: string; // ISO string
};

export type BeliefShift = {
  marketId: string;
  previousProbability: number;
  currentProbability: number;
  delta: number;
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

