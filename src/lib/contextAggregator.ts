import { Market, BeliefShift } from "@/types";
import { fetchNewsForMarket, fetchGoogleNewsForMarket, NewsArticle } from "./providers/news";
import { fetchTweetsForMarket, TwitterPost } from "./providers/twitter";
import { fetchPolymarketMarkets } from "./providers/polymarket";
import { searchWebForMarket, generateContextFromSearch, WebSearchResult } from "./providers/webSearch";

export type EnrichedContext = {
  market: Market;
  shift?: BeliefShift | null;
  news: NewsArticle[];
  tweets: TwitterPost[];
  webSearch: WebSearchResult[];
  relatedMarkets: Market[];
  summary: string;
  keyDrivers: string[];
  fallbackExplanation: string;
};

/**
 * Aggregates context from multiple sources: news, Twitter/X, and Polymarket
 */
export async function aggregateContext(
  market: Market,
  shift?: BeliefShift | null,
): Promise<EnrichedContext> {
  // Fetch data from all sources in parallel
  const [news, tweets, allMarkets, webSearch] = await Promise.all([
    // Try NewsAPI first, fallback to Google News
    fetchNewsForMarket(market).catch(() => fetchGoogleNewsForMarket(market)),
    fetchTweetsForMarket(market).catch(() => []),
    fetchPolymarketMarkets().catch(() => []),
    // Always try web search as fallback
    searchWebForMarket(market).catch(() => []),
  ]);

  // Find related markets (same category or similar keywords)
  const relatedMarkets = findRelatedMarkets(market, allMarkets);

  // Generate summary and key drivers
  const { summary, keyDrivers } = generateSummary(market, shift, news, tweets, webSearch);

  // Generate fallback explanation using market title + web search
  const fallbackExplanation = webSearch.length > 0
    ? generateContextFromSearch(market, webSearch)
    : `Market question: "${market.question}". This prediction market reflects current sentiment about this topic. Current probability: ${Math.round(market.probability * 100)}%.`;

  return {
    market,
    shift: shift ?? null,
    news: news.slice(0, 5), // Limit to 5 most relevant
    tweets: tweets.slice(0, 10), // Limit to 10 most relevant
    webSearch: webSearch.slice(0, 5), // Limit to 5 search results
    relatedMarkets: relatedMarkets.slice(0, 5), // Limit to 5 related markets
    summary,
    keyDrivers,
    fallbackExplanation,
  };
}

/**
 * Finds markets related to the current market
 */
function findRelatedMarkets(market: Market, allMarkets: Market[]): Market[] {
  const marketKeywords = extractKeywords(market.question);
  const marketCategory = market.assetId || "general";

  return allMarkets
    .filter((m) => m.id !== market.id)
    .map((m) => {
      const keywords = extractKeywords(m.question);
      const category = m.assetId || "general";
      
      // Calculate relevance score
      const keywordMatch = keywords.filter((k) => marketKeywords.includes(k)).length;
      const categoryMatch = category === marketCategory ? 1 : 0;
      const score = keywordMatch * 2 + categoryMatch;

      return { market: m, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ market }) => market);
}

/**
 * Extracts keywords from a question
 */
function extractKeywords(question: string): string[] {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 5);
}

/**
 * Generates a summary and identifies key drivers from aggregated context
 */
function generateSummary(
  market: Market,
  shift: BeliefShift | null | undefined,
  news: NewsArticle[],
  tweets: TwitterPost[],
  webSearch: WebSearchResult[],
): { summary: string; keyDrivers: string[] } {
  const drivers: string[] = [];

  // Analyze news for key drivers
  if (news.length > 0) {
    const recentNews = news.filter(
      (article) =>
        new Date(article.publishedAt).getTime() >
        Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
    );
    if (recentNews.length > 0) {
      drivers.push(`${recentNews.length} recent news article${recentNews.length > 1 ? "s" : ""} covering this topic`);
    }
  }

  // Analyze Twitter activity
  if (tweets.length > 0) {
    const recentTweets = tweets.filter(
      (tweet) =>
        new Date(tweet.createdAt).getTime() >
        Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
    );
    if (recentTweets.length > 0) {
      const totalEngagement = recentTweets.reduce(
        (sum, t) => sum + (t.likeCount || 0) + (t.retweetCount || 0),
        0,
      );
      drivers.push(`Significant social media discussion (${recentTweets.length} recent posts, ${totalEngagement} engagements)`);
    }
  }

  // Analyze web search results
  if (webSearch.length > 0) {
    drivers.push(`Web research found ${webSearch.length} relevant source${webSearch.length > 1 ? "s" : ""} providing context`);
  }

  // Analyze probability shift
  if (shift && Math.abs(shift.delta) >= 0.05) {
    const direction = shift.delta > 0 ? "increase" : "decrease";
    drivers.push(`Notable probability ${direction} of ${Math.abs(shift.delta * 100).toFixed(1)} percentage points`);
  }

  // Generate summary - always include market title
  let summary = `Market question: "${market.question}"`;
  
  if (drivers.length > 0) {
    summary += `. Key factors: ${drivers.slice(0, 3).join("; ")}.`;
  } else if (webSearch.length > 0) {
    // Use web search context if no other drivers
    const searchContext = webSearch[0]?.snippet?.substring(0, 150);
    if (searchContext) {
      summary += `. Research indicates: ${searchContext}...`;
    } else {
      summary += `. Current probability: ${Math.round(market.probability * 100)}%.`;
    }
  } else {
    summary += `. Current probability: ${Math.round(market.probability * 100)}%.`;
  }

  return { summary, keyDrivers: drivers };
}
