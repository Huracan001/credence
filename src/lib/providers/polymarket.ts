import { Market } from "@/types";

// Gamma API provides richer fields; prefer it over clob where possible.
const POLYMARKET_URL =
  "https://gamma-api.polymarket.com/markets?limit=100&offset=0&closed=false";

const MIN_VOLUME = 1_000; // temporary relaxed floor for early signal
const MIN_LIQUIDITY = 250; // temporary relaxed floor for early signal
const MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000; // drop markets not updated in 7 days

type PolymarketMarket = {
  id: string;
  question?: string;
  title?: string;
  outcomes?: string[] | string;
  outcomePrices?: Array<number | string> | string;
  bestBid?: number | string;
  bestAsk?: number | string;
  lastPrice?: number | string;
  liquidity?: number | string;
  volume24h?: number | string;
  openInterest?: number | string;
  created_at?: string;
  updated_at?: string;
  endDate?: string;
  closeTime?: string;
  active?: boolean;
  closed?: boolean;
  status?: string;
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

function toArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function findYesIndex(outcomes?: string[]): number | null {
  if (!outcomes || !outcomes.length) return null;
  const idx = outcomes.findIndex((o) => typeof o === "string" && o.toLowerCase() === "yes");
  return idx >= 0 ? idx : null;
}

function pickProbability(
  raw: PolymarketMarket,
  yesIndex: number | null,
  outcomePrices: Array<number | string>,
): number | null {
  const bid = toNumber(raw.bestBid);
  const ask = toNumber(raw.bestAsk);

  if (bid !== null && ask !== null) {
    const mid = (bid + ask) / 2;
    if (mid > 0 && mid < 1) return mid;
  }

  if (yesIndex !== null && outcomePrices.length > yesIndex) {
    const price = toNumber(outcomePrices[yesIndex]);
    if (price !== null && price > 0 && price < 1) return price;
  }

  return null;
}

function normalizeMarket(raw: PolymarketMarket): Market | null {
  const outcomes = toArray<string>(raw.outcomes);
  const outcomePrices = toArray<number | string>(raw.outcomePrices);

  const yesIndex = findYesIndex(outcomes);
  const probability = pickProbability(raw, yesIndex, outcomePrices);
  if (probability === null) return null;

  const question = raw.question ?? raw.title ?? "Untitled market";
  const volume24h = toNumber(raw.volume24h);
  const liquidity = toNumber(raw.liquidity);
  const volume =
    volume24h ??
    toNumber(raw.openInterest) ??
    liquidity ??
    0;
  const updatedAt = raw.updated_at ?? raw.created_at ?? new Date().toISOString();
  const bestBid = toNumber(raw.bestBid);
  const bestAsk = toNumber(raw.bestAsk);
  const lastPrice = toNumber(raw.lastPrice);
  const hasOrderBook = bestBid !== null || bestAsk !== null;
  const status = raw.status?.toLowerCase();
  const closedStatuses = new Set(["closed", "resolved", "settled", "finalized", "expired"]);
  const isResolvedOrClosed =
    raw.closed === true ||
    raw.active === false ||
    (status ? closedStatuses.has(status) : false);
  const expiresAt = raw.endDate ? new Date(raw.endDate) : raw.closeTime ? new Date(raw.closeTime) : null;
  const expired = expiresAt ? expiresAt.getTime() < Date.now() : false;
  const updatedAtMs = new Date(updatedAt).getTime();
  const stale = Number.isFinite(updatedAtMs) && updatedAtMs < Date.now() - MAX_STALE_MS;
  const yearInText = (() => {
    const text = `${raw.question ?? ""} ${raw.title ?? ""}`;
    const matches = text.match(/20\d{2}/g);
    if (!matches) return null;
    const years = matches.map((y) => parseInt(y, 10)).filter((y) => !Number.isNaN(y));
    return years.length ? Math.max(...years) : null;
  })();
  const currentYear = new Date().getFullYear();
  const isPastYear = yearInText !== null && yearInText < currentYear;

  if (volume < MIN_VOLUME) return null;
  if (!hasOrderBook) return null;
  if (liquidity !== null && liquidity < MIN_LIQUIDITY) return null;
  if (isResolvedOrClosed || expired) return null;
  if (stale) return null;
  if (isPastYear) return null;

  return {
    id: raw.id ?? question.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
    question,
    probability,
    volume: volume ?? 0,
    volume24h: volume24h ?? null,
    bestBid,
    bestAsk,
    lastPrice,
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

