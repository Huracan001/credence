import { Market } from "@/types";

export type NewsArticle = {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  relevanceScore?: number;
};

/**
 * Extracts key terms from market question for news search
 */
function extractSearchTerms(market: Market): string[] {
  const question = market.question.toLowerCase();
  const terms: string[] = [];
  
  // Remove common words
  const stopWords = new Set([
    "will", "the", "be", "to", "of", "and", "a", "in", "that", "for", "is",
    "it", "as", "was", "with", "on", "by", "this", "or", "at", "from",
    "an", "are", "have", "has", "had", "do", "does", "did", "what", "when",
    "where", "who", "which", "how", "why", "can", "could", "should", "would",
  ]);

  // Extract meaningful words
  const words = question
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  // Add asset ID if available (e.g., "bitcoin", "ethereum")
  if (market.assetId) {
    terms.push(market.assetId);
  }

  // Add extracted words
  terms.push(...words.slice(0, 5)); // Limit to top 5 terms

  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Fetches news articles relevant to a market
 * Uses NewsAPI (free tier: 100 requests/day)
 * Fallback: Returns empty array if API key not configured
 */
export async function fetchNewsForMarket(market: Market): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn("[news] NEWS_API_KEY not configured, skipping news fetch");
    return [];
  }

  try {
    const searchTerms = extractSearchTerms(market);
    if (searchTerms.length === 0) {
      return [];
    }

    // Use the most relevant term for search
    const query = searchTerms[0];
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&language=en`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
      },
      cache: "no-store",
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.warn(`[news] NewsAPI returned ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      articles?: Array<{
        title?: string;
        description?: string;
        url?: string;
        source?: { name?: string };
        publishedAt?: string;
      }>;
    };

    const articles: NewsArticle[] = (data.articles || [])
      .filter((article) => article.title && article.url)
      .map((article) => ({
        title: article.title || "",
        description: article.description || "",
        url: article.url || "",
        source: article.source?.name || "Unknown",
        publishedAt: article.publishedAt || new Date().toISOString(),
      }))
      .slice(0, 5); // Limit to 5 articles

    return articles;
  } catch (err) {
    console.error("[news] Failed to fetch news", err);
    return [];
  }
}

/**
 * Alternative: Google News RSS (no API key required, but less structured)
 */
export async function fetchGoogleNewsForMarket(market: Market): Promise<NewsArticle[]> {
  try {
    const searchTerms = extractSearchTerms(market);
    if (searchTerms.length === 0) {
      return [];
    }

    const query = searchTerms.join(" ");
    // Google News RSS feed
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(url, {
      cache: "no-store",
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    // Simple XML parsing (could use a proper parser)
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    const articles: NewsArticle[] = items.slice(0, 5).map((item) => {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      
      return {
        title: titleMatch?.[1] || "",
        description: "",
        url: linkMatch?.[1] || "",
        source: "Google News",
        publishedAt: pubDateMatch?.[1] || new Date().toISOString(),
      };
    });

    return articles.filter((a) => a.title && a.url);
  } catch (err) {
    console.error("[news] Failed to fetch Google News", err);
    return [];
  }
}
