import { Market } from "@/types";

// Gamma API provides richer fields; prefer it over clob where possible.
const POLYMARKET_URL =
  "https://gamma-api.polymarket.com/markets?limit=100&offset=0&closed=false";

type PolymarketMarket = {
  id: string;
  question?: string;
  title?: string;
  outcomes?: string[];
  outcomePrices?: Array<number | string>;
  bestBid?: number | string;
  bestAsk?: number | string;
  lastPrice?: number | string;
  liquidity?: number | string;
  volume24h?: number | string;
  openInterest?: number | string;
  created_at?: string;
  updated_at?: string;
};

const fallbackMarkets: Market[] = [
  {
    id: "fallback-btc-etf",
    question: "Will U.S.-listed Bitcoin spot ETFs record net inflows this quarter?",
    probability: 0.6,
    volume: 5_000_000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "fallback-eth-upgrade",
    question: "Will Ethereum ship the next major upgrade before May 2026?",
    probability: 0.7,
    volume: 3_000_000,
    updatedAt: new Date().toISOString(),
  },
];

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function pickProbability(market: PolymarketMarket): number | null {
  const yesFromOutcome =
    market.outcomePrices && market.outcomePrices.length
      ? toNumber(market.outcomePrices[0])
      : null;
  if (yesFromOutcome !== null) return yesFromOutcome;

  const bid = toNumber(market.bestBid);
  const ask = toNumber(market.bestAsk);
  if (bid !== null && ask !== null) return (bid + ask) / 2;

  const last = toNumber(market.lastPrice);
  return last;
}

function normalizeMarket(raw: PolymarketMarket): Market | null {
  const probability = pickProbability(raw);
  if (probability === null) return null;

  const question = raw.question ?? raw.title ?? "Untitled market";
  const volume =
    toNumber(raw.volume24h) ??
    toNumber(raw.openInterest) ??
    toNumber(raw.liquidity) ??
    0;
  const updatedAt = raw.updated_at ?? raw.created_at ?? new Date().toISOString();

  return {
    id: raw.id ?? question.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
    question,
    probability,
    volume: volume ?? 0,
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

