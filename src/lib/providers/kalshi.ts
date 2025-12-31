/**
 * Minimal Kalshi market fetcher.
 * Uses either a bearer token (KALSHI_AUTH_TOKEN) or email/password (KALSHI_EMAIL, KALSHI_PASSWORD).
 * Falls back to mock data on failure.
 */

import { Market } from "@/types";

type KalshiMarket = {
  id: string;
  title?: string;
  ticker?: string;
  yes_bid?: number | string | null;
  yes_ask?: number | string | null;
  last_price?: number | string | null;
  volume?: number | string | null;
  open_interest?: number | string | null;
  liquidity?: number | string | null;
  close_time?: string;
  end_date?: string;
  updated_at?: string;
};

type KalshiResponse = {
  markets: KalshiMarket[];
};

const fallbackMarkets: Market[] = [
  {
    id: "kalshi-fallback-1",
    question: "Will BTC be above $60k at month-end?",
    probability: 0.35,
    volume: 2_000_000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kalshi-fallback-2",
    question: "Will ETH staking APR stay above 3% this quarter?",
    probability: 0.58,
    volume: 1_200_000,
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

async function getAuthToken(): Promise<string | null> {
  if (process.env.KALSHI_AUTH_TOKEN) return process.env.KALSHI_AUTH_TOKEN;
  const email = process.env.KALSHI_EMAIL;
  const password = process.env.KALSHI_PASSWORD;
  if (!email || !password) return null;

  try {
    const res = await fetch("https://api.kalshi.com/trade-api/v2/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`login ${res.status}`);
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch (err) {
    console.error("[kalshi] login failed", err);
    return null;
  }
}

function pickProbability(m: KalshiMarket): number | null {
  const bid = toNumber(m.yes_bid);
  const ask = toNumber(m.yes_ask);
  const last = toNumber(m.last_price);

  if (bid !== null && ask !== null) return (bid + ask) / 2;
  if (last !== null) return last;
  if (bid !== null) return bid;
  if (ask !== null) return ask;
  return null;
}

function normalizeMarket(raw: KalshiMarket): Market | null {
  const probability = pickProbability(raw);
  if (probability === null) return null;

  const question = raw.title ?? raw.ticker ?? "Untitled market";
  const volume =
    toNumber(raw.volume) ?? toNumber(raw.open_interest) ?? toNumber(raw.liquidity) ?? 0;
  const updatedAt =
    raw.updated_at ?? raw.end_date ?? raw.close_time ?? new Date().toISOString();

  return {
    id: raw.id,
    question,
    probability,
    volume: volume ?? 0,
    updatedAt,
    bestBid: toNumber(raw.yes_bid),
    bestAsk: toNumber(raw.yes_ask),
    lastPrice: toNumber(raw.last_price),
  };
}

export async function fetchKalshiMarkets(): Promise<Market[]> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  if (token) headers.authorization = `Bearer ${token}`;

  try {
    const res = await fetch("https://api.kalshi.com/trade-api/v2/markets", {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`kalshi ${res.status}`);
    const data = (await res.json()) as KalshiResponse;
    const list = Array.isArray((data as unknown as { markets?: unknown }).markets)
      ? (data as { markets: KalshiMarket[] }).markets
      : (data as unknown as KalshiMarket[]);

    const normalized = (list ?? [])
      .map(normalizeMarket)
      .filter((m): m is Market => Boolean(m));

    if (!normalized.length) throw new Error("kalshi returned no usable markets");
    return normalized;
  } catch (err) {
    console.error("[kalshi] falling back to mock data", err);
    return fallbackMarkets;
  }
}
