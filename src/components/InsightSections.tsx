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
          <div key={section.key} className="glass-panel h-full p-6">
            <div className="mb-4 flex items-start justify-between border-b border-[#e5e5e5] pb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-1">
                  {section.title}
                </p>
                {section.helper ? (
                  <p className="text-xs text-[#8e8e8e]">{section.helper}</p>
                ) : null}
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-[#4a4a4a]">
              {lines.map((line, idx) => (
                <li key={idx} className="border-l-2 border-[#e5e5e5] pl-4">
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

