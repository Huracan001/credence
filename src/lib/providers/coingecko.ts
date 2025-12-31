type CoinGeckoSimpleResponse = Record<
  string,
  {
    usd: number;
    usd_24h_change?: number;
    last_updated_at?: number;
  }
>;

// Minimal CoinGecko client for price + 24h change. Keyless public endpoint.
export async function fetchCoinPrices(
  coinIds: string[],
): Promise<Record<string, { priceUsd: number; change24h: number | null }>> {
  if (!coinIds.length) return {};

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", coinIds.join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");
  url.searchParams.set("precision", "6");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const data = (await res.json()) as CoinGeckoSimpleResponse;

    const out: Record<string, { priceUsd: number; change24h: number | null }> = {};
    for (const [id, info] of Object.entries(data)) {
      out[id] = {
        priceUsd: info.usd,
        change24h: info.usd_24h_change ?? null,
      };
    }
    return out;
  } catch (err) {
    console.error("[coingecko] failed", err);
    return {};
  }
}
