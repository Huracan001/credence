import { Market } from "@/types";

export type TwitterPost = {
  id: string;
  text: string;
  author: string;
  authorHandle: string;
  createdAt: string;
  likeCount?: number;
  retweetCount?: number;
  relevanceScore?: number;
};

/**
 * Extracts search terms from market for Twitter search
 */
function extractSearchTerms(market: Market): string {
  const question = market.question.toLowerCase();
  
  // Remove question words and common terms
  const cleaned = question
    .replace(/\b(will|the|be|to|of|and|a|in|that|for|is|it|as|was|with|on|by|this|or|at|from)\b/g, "")
    .replace(/[^\w\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .join(" ");

  // Add asset ID if available
  if (market.assetId) {
    return `${market.assetId} ${cleaned}`.trim();
  }

  return cleaned;
}

/**
 * Fetches relevant tweets for a market using Twitter API v2
 * Requires TWITTER_BEARER_TOKEN environment variable
 */
export async function fetchTweetsForMarket(market: Market): Promise<TwitterPost[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.warn("[twitter] TWITTER_BEARER_TOKEN not configured, skipping Twitter fetch");
    return [];
  }

  try {
    const query = extractSearchTerms(market);
    if (!query || query.length < 3) {
      return [];
    }

    // Twitter API v2 search endpoint
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username,name`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
      cache: "no-store",
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.warn(`[twitter] Twitter API returned ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        text: string;
        created_at?: string;
        author_id?: string;
        public_metrics?: {
          like_count?: number;
          retweet_count?: number;
        };
      }>;
      includes?: {
        users?: Array<{
          id: string;
          username?: string;
          name?: string;
        }>;
      };
    };

    if (!data.data || !data.includes?.users) {
      return [];
    }

    const userMap = new Map(
      (data.includes.users || []).map((user) => [user.id, user])
    );

    const posts: TwitterPost[] = (data.data || [])
      .map((tweet) => {
        const user = userMap.get(tweet.author_id || "");
        return {
          id: tweet.id,
          text: tweet.text,
          author: user?.name || "Unknown",
          authorHandle: user?.username ? `@${user.username}` : "@unknown",
          createdAt: tweet.created_at || new Date().toISOString(),
          likeCount: tweet.public_metrics?.like_count,
          retweetCount: tweet.public_metrics?.retweet_count,
        };
      })
      .slice(0, 10); // Limit to 10 tweets

    return posts;
  } catch (err) {
    console.error("[twitter] Failed to fetch tweets", err);
    return [];
  }
}

/**
 * Alternative: Search Twitter/X via web scraping (fallback, less reliable)
 * Note: This is a placeholder - actual implementation would require
 * proper scraping tools and may violate Twitter's ToS
 */
export async function fetchTweetsViaWeb(market: Market): Promise<TwitterPost[]> {
  // Placeholder - would need proper scraping implementation
  // For now, return empty array
  console.warn("[twitter] Web scraping not implemented, use Twitter API instead");
  return [];
}
