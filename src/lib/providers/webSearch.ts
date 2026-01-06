import { Market } from "@/types";

export type WebSearchResult = {
  title: string;
  snippet: string;
  url: string;
  source: string;
};

/**
 * Performs web search using DuckDuckGo Instant Answer API (no API key required)
 * Falls back to Google Custom Search if GOOGLE_SEARCH_API_KEY is configured
 */
export async function searchWebForMarket(market: Market): Promise<WebSearchResult[]> {
  const query = market.question;
  
  // Try Google Custom Search first if API key is available
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleCx = process.env.GOOGLE_SEARCH_CX;
  
  if (googleApiKey && googleCx) {
    try {
      return await searchGoogle(query, googleApiKey, googleCx);
    } catch (err) {
      console.warn("[webSearch] Google search failed, trying DuckDuckGo", err);
    }
  }

  // Fallback to DuckDuckGo HTML scraping (no API key required)
  try {
    return await searchDuckDuckGo(query);
  } catch (err) {
    console.error("[webSearch] DuckDuckGo search failed", err);
    return [];
  }
}

/**
 * Google Custom Search API
 */
async function searchGoogle(
  query: string,
  apiKey: string,
  cx: string,
): Promise<WebSearchResult[]> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;

  const response = await fetch(url, {
    cache: "no-store",
    next: { revalidate: 600 }, // Cache for 10 minutes
  });

  if (!response.ok) {
    throw new Error(`Google Search API returned ${response.status}`);
  }

  const data = (await response.json()) as {
    items?: Array<{
      title?: string;
      snippet?: string;
      link?: string;
      displayLink?: string;
    }>;
  };

  return (data.items || []).map((item) => ({
    title: item.title || "",
    snippet: item.snippet || "",
    url: item.link || "",
    source: item.displayLink || "Web",
  }));
}

/**
 * DuckDuckGo HTML scraping (no API key required)
 * Uses DuckDuckGo's HTML search results
 */
async function searchDuckDuckGo(query: string): Promise<WebSearchResult[]> {
  // DuckDuckGo search URL
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    cache: "no-store",
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo returned ${response.status}`);
  }

  const html = await response.text();
  const results: WebSearchResult[] = [];

  // Simple HTML parsing for DuckDuckGo results
  // DuckDuckGo uses specific class names for results
  const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
  const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/g;

  const links: Array<{ url: string; title: string }> = [];
  let match;
  while ((match = resultRegex.exec(html)) !== null && links.length < 5) {
    links.push({
      url: match[1],
      title: match[2].replace(/<[^>]*>/g, "").trim(),
    });
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
    snippets.push(match[1].replace(/<[^>]*>/g, "").trim());
  }

  // Combine links and snippets
  for (let i = 0; i < Math.min(links.length, 5); i++) {
    const link = links[i];
    const snippet = snippets[i] || "";
    const domain = new URL(link.url).hostname.replace("www.", "");

    results.push({
      title: link.title,
      snippet,
      url: link.url,
      source: domain,
    });
  }

  return results;
}

/**
 * Generates a contextual explanation from web search results
 */
export function generateContextFromSearch(
  market: Market,
  searchResults: WebSearchResult[],
): string {
  if (searchResults.length === 0) {
    return `Market question: "${market.question}". This prediction market reflects current sentiment about this topic.`;
  }

  // Extract key information from search results
  const snippets = searchResults
    .map((r) => r.snippet)
    .filter((s) => s.length > 20)
    .slice(0, 3)
    .join(" ");

  // Build explanation
  let explanation = `Market question: "${market.question}". `;
  
  if (snippets.length > 50) {
    // Summarize the snippets (first 200 chars)
    const summary = snippets.substring(0, 200).replace(/\s+\S*$/, "") + "...";
    explanation += `Recent information suggests: ${summary} `;
  }

  explanation += `Current market probability: ${Math.round(market.probability * 100)}%.`;

  return explanation;
}
