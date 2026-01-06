import { EnrichedContext as EnrichedContextType } from "@/lib/contextAggregator";
import Link from "next/link";

type EnrichedContextProps = {
  context: EnrichedContextType;
};

export function EnrichedContext({ context }: EnrichedContextProps) {
  const { news, tweets, webSearch, relatedMarkets, keyDrivers } = context;

  return (
    <div className="space-y-6">
      {/* Key Drivers */}
      {keyDrivers.length > 0 && (
        <div className="glass-panel p-6 glow-border">
          <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] mb-4 font-semibold flex items-center gap-2">
            <span className="w-1 h-4 bg-[#00d9ff]"></span>
            KEY DRIVERS
          </p>
          <ul className="space-y-2">
            {keyDrivers.map((driver, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[#6b7280]">
                <span className="text-[#00d9ff] mt-1">•</span>
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* News Articles */}
      {news.length > 0 && (
        <div className="glass-panel glow-border">
          <div className="border-b border-[#1a1f2e] px-6 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2">
              <span className="w-1 h-4 bg-[#00d9ff]"></span>
              RECENT NEWS
            </p>
            <p className="text-xs text-[#6b7280] mt-1 uppercase tracking-wider">
              Articles that may be influencing market sentiment
            </p>
          </div>
          <div className="divide-y divide-[#1a1f2e]">
            {news.map((article, index) => (
              <div
                key={index}
                className="px-6 py-4 transition-all hover:bg-[#1a1f2e]/30 hover:border-l-2 hover:border-l-[#00d9ff]"
              >
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block space-y-2 group"
                >
                  <h3 className="text-sm font-bold text-[#f0f0f0] group-hover:text-[#00d9ff] transition-colors">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-xs text-[#6b7280] leading-relaxed line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#6b7280] uppercase tracking-wider">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Twitter/X Posts */}
      {tweets.length > 0 && (
        <div className="glass-panel glow-border">
          <div className="border-b border-[#1a1f2e] px-6 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2">
              <span className="w-1 h-4 bg-[#00d9ff]"></span>
              SOCIAL DISCUSSION
            </p>
            <p className="text-xs text-[#6b7280] mt-1 uppercase tracking-wider">
              Recent X/Twitter posts about this topic
            </p>
          </div>
          <div className="divide-y divide-[#1a1f2e]">
            {tweets.slice(0, 5).map((tweet) => (
              <div
                key={tweet.id}
                className="px-6 py-4 transition-all hover:bg-[#1a1f2e]/30 hover:border-l-2 hover:border-l-[#00d9ff]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                    <span className="font-semibold text-[#00d9ff]">{tweet.authorHandle}</span>
                    <span>•</span>
                    <span>
                      {new Date(tweet.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-[#f0f0f0] leading-relaxed">{tweet.text}</p>
                  {(tweet.likeCount || tweet.retweetCount) && (
                    <div className="flex items-center gap-4 text-xs text-[#6b7280]">
                      {tweet.likeCount !== undefined && tweet.likeCount > 0 && (
                        <span>❤️ {tweet.likeCount.toLocaleString()}</span>
                      )}
                      {tweet.retweetCount !== undefined && tweet.retweetCount > 0 && (
                        <span>🔄 {tweet.retweetCount.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Web Search Results */}
      {webSearch.length > 0 && (
        <div className="glass-panel glow-border">
          <div className="border-b border-[#1a1f2e] px-6 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2">
              <span className="w-1 h-4 bg-[#00d9ff]"></span>
              WEB RESEARCH
            </p>
            <p className="text-xs text-[#6b7280] mt-1 uppercase tracking-wider">
              Contextual information from web search
            </p>
          </div>
          <div className="divide-y divide-[#1a1f2e]">
            {webSearch.map((result, index) => (
              <div
                key={index}
                className="px-6 py-4 transition-all hover:bg-[#1a1f2e]/30 hover:border-l-2 hover:border-l-[#00d9ff]"
              >
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block space-y-2 group"
                >
                  <h3 className="text-sm font-bold text-[#f0f0f0] group-hover:text-[#00d9ff] transition-colors">
                    {result.title}
                  </h3>
                  {result.snippet && (
                    <p className="text-xs text-[#6b7280] leading-relaxed line-clamp-2">
                      {result.snippet}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#6b7280] uppercase tracking-wider">
                    <span>{result.source}</span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Markets */}
      {relatedMarkets.length > 0 && (
        <div className="glass-panel glow-border">
          <div className="border-b border-[#1a1f2e] px-6 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2">
              <span className="w-1 h-4 bg-[#00d9ff]"></span>
              RELATED MARKETS
            </p>
            <p className="text-xs text-[#6b7280] mt-1 uppercase tracking-wider">
              Similar markets showing comparable patterns
            </p>
          </div>
          <div className="divide-y divide-[#1a1f2e]">
            {relatedMarkets.map((market) => (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="block px-6 py-4 transition-all hover:bg-[#1a1f2e]/30 hover:border-l-2 hover:border-l-[#00d9ff]"
              >
                <h3 className="text-sm font-bold text-[#f0f0f0] hover:text-[#00d9ff] transition-colors">
                  {market.question}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#6b7280]">
                  <span className="uppercase tracking-wider">
                    {Math.round(market.probability * 100)}% PROBABILITY
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
