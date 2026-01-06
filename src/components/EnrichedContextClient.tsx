"use client";

import { useEffect, useState } from "react";
import { EnrichedContext } from "./EnrichedContext";
import { EnrichedContext as EnrichedContextType } from "@/lib/contextAggregator";

type EnrichedContextClientProps = {
  marketId: string;
};

export function EnrichedContextClient({ marketId }: EnrichedContextClientProps) {
  const [context, setContext] = useState<EnrichedContextType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContext() {
      try {
        const response = await fetch(`/api/markets/${marketId}/context`);
        if (!response.ok) {
          throw new Error("Failed to fetch enriched context");
        }
        const data = await response.json();
        setContext(data.context);
      } catch (err) {
        console.error("[EnrichedContextClient] Failed to fetch context", err);
        setError("Unable to load enriched context");
      } finally {
        setLoading(false);
      }
    }

    fetchContext();
  }, [marketId]);

  if (loading) {
    return (
      <div className="glass-panel p-6 glow-border">
        <p className="text-sm text-[#6b7280] uppercase tracking-wider">
          Loading context from news, X, and Polymarket...
        </p>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="glass-panel p-6 glow-border">
        <p className="text-sm text-[#6b7280] uppercase tracking-wider">
          {error || "No enriched context available"}
        </p>
        <p className="text-xs text-[#6b7280] mt-2">
          Note: Configure NEWS_API_KEY and TWITTER_BEARER_TOKEN environment variables to enable enriched context.
        </p>
      </div>
    );
  }

  return <EnrichedContext context={context} />;
}
