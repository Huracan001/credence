import { StoredInsight } from "@/types";

type Props = {
  insight: StoredInsight;
};

const sections: Array<{
  key: keyof StoredInsight;
  title: string;
  helper?: string;
}> = [
  {
    key: "summary",
    title: "Market summary",
    helper: "Plain-English view of the current implied belief",
  },
  {
    key: "whatChanged",
    title: "What changed",
    helper: "Recent movements worth noting",
  },
  {
    key: "whyMoved",
    title: "Why the market moved",
    helper: "Context observed by participants",
  },
  {
    key: "uncertainty",
    title: "What the market is still unsure about",
    helper: "Gaps, blockers, and unknowns",
  },
  {
    key: "interpretation",
    title: "Interpretation",
    helper: "Cautious takeaway without advice",
  },
];

export function InsightSections({ insight }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {sections.map((section) => {
        const content = insight[section.key];
        const lines = Array.isArray(content) ? content : [content];
        return (
          <div key={section.key} className="glass-panel h-full p-6 glow-border">
            <div className="mb-4 flex items-start justify-between border-b border-[#1a1f2e] pb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] mb-1 font-semibold flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#00d9ff]"></span>
                  {section.title.toUpperCase()}
                </p>
                {section.helper ? (
                  <p className="text-xs text-[#6b7280] uppercase tracking-wider mt-1">{section.helper}</p>
                ) : null}
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-[#6b7280]">
              {lines.map((line, idx) => (
                <li key={idx} className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
                  <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

