type Category = "crypto" | "economy" | "politics" | "general";

type Props = {
  category: Category;
  className?: string;
};

export function CategoryBadge({ category, className = "" }: Props) {
  if (category === "general") return null;

  const config = {
    crypto: {
      label: "CRYPTO",
      color: "text-[#00d9ff]",
      borderColor: "border-[#00d9ff]",
      bgColor: "bg-[#00d9ff]/10",
      glow: "shadow-[0_0_8px_rgba(0,217,255,0.3)]",
    },
    economy: {
      label: "ECONOMY",
      color: "text-[#ffa500]",
      borderColor: "border-[#ffa500]",
      bgColor: "bg-[#ffa500]/10",
      glow: "shadow-[0_0_8px_rgba(255,165,0,0.3)]",
    },
    politics: {
      label: "POLITICS",
      color: "text-[#ff0040]",
      borderColor: "border-[#ff0040]",
      bgColor: "bg-[#ff0040]/10",
      glow: "shadow-[0_0_8px_rgba(255,0,64,0.3)]",
    },
  };

  const style = config[category];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black tracking-wider uppercase border ${style.borderColor} ${style.bgColor} ${style.color} ${style.glow} ${className}`}
    >
      {style.label}
    </span>
  );
}

// Helper function to get category from market question
export function getCategoryFromMarket(question: string, assetId?: string | null): Category {
  const q = question.toLowerCase();
  
  // Check for crypto first (includes assetId detection)
  if (assetId) return "crypto";
  
  const cryptoKeywords = [
    "crypto", "cryptocurrency", "bitcoin", "btc", "ethereum", "eth", "blockchain",
    "token", "stablecoin", "defi", "nft", "solana", "sol", "cardano", "ada",
    "xrp", "ripple", "doge", "dogecoin", "bnb", "binance", "tether", "usdt",
    "usdc", "usd coin", "etf",
  ];
  if (cryptoKeywords.some((keyword) => q.includes(keyword))) return "crypto";
  
  // Check for economy
  const economyKeywords = [
    "inflation", "cpi", "gdp", "economy", "economic", "recession", "interest rate",
    "rates", "federal reserve", "fed", "jobs report", "employment", "unemployment",
    "treasury", "yield", "monetary policy", "fiscal", "stimulus", "quantitative easing",
    "qe", "stock market", "s&p", "dow", "nasdaq",
  ];
  if (economyKeywords.some((keyword) => q.includes(keyword))) return "economy";
  
  // Check for politics
  const politicsKeywords = [
    "election", "president", "presidential", "congress", "senate", "house",
    "senator", "representative", "governor", "mayor", "vote", "voting", "ballot",
    "campaign", "candidate", "democrat", "republican", "party", "political",
    "politics", "policy", "legislation", "bill", "law", "supreme court", "scotus",
    "impeachment", "approval rating", "poll", "polling",
  ];
  if (politicsKeywords.some((keyword) => q.includes(keyword))) return "politics";
  
  return "general";
}
