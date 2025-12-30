import { Market } from "@/types";

const POLYMARKET_URL =
  "https://clob.polymarket.com/markets?limit=50&offset=0&active=true";

type PolymarketMarket = {
  id: string;
  question?: string;
  title?: string;
  outcomes?: string[];
  outcomePrices?: number[];
  liquidity?: number;
  volume24h?: number;
  created_at?: string;
  updated_at?: string;
};

const fallbackMarkets: Market[] = [
  {
    id: "fallback-btc-etf",
    question: "Will U.S.-listed Bitcoin spot ETFs record net inflows this quarter?",
    probability: 0.6,
    volume: 5000000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fallback-eth-upgrade",
    question: "Will Ethereum ship the next major upgrade before May 2026?",
    probability: 0.7,
    volume: 3000000,
    updatedAt: new Date().toISOString(),
  },
];

function pickProbability(market: PolymarketMarket): number | null {
  if (market.outcomePrices && market.outcomePrices.length) {
    // Assume first outcome represents "Yes" probability
    const value = market.outcomePrices[0];
    if (typeof value === "number" && !Number.isNaN(value)) return value;
  }
  return null;
}

function normalizeMarket(raw: PolymarketMarket): Market | null {
  const probability = pickProbability(raw);
  if (probability === null) return null;

  const question = raw.question ?? raw.title ?? "Untitled market";
  const volume = raw.volume24h ?? raw.liquidity ?? 0;
  const updatedAt = raw.updated_at ?? raw.created_at ?? new Date().toISOString();

  return {
    id: raw.id ?? question.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
    question,
    probability,
    volume,
    updatedAt,
  };
}

export async function fetchPolymarketMarkets(): Promise<Market[]> {
  try {
    const res = await fetch(POLYMARKET_URL, {
      headers: {
        accept: "application/json",
      },
      // Server-side only
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Polymarket responded ${res.status}`);
    }
    const data = (await res.json()) as unknown;
    const list: PolymarketMarket[] = extractMarkets(data);

    const normalized = list
      .map(normalizeMarket)
      .filter((m): m is Market => Boolean(m));

    if (!normalized.length) {
      throw new Error("Polymarket returned no usable markets");
    }

    return normalized;
  } catch (err) {
    console.error("[polymarket] falling back to mock data", err);
    return fallbackMarkets;
  }
}

function extractMarkets(payload: unknown): PolymarketMarket[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is PolymarketMarket => typeof item === "object");
  }
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { markets?: unknown }).markets)
  ) {
    return (payload as { markets: PolymarketMarket[] }).markets;
  }
  return [];
}

