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
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => {
        const content = insight[section.key];
        const lines = Array.isArray(content) ? content : [content];
        return (
          <div key={section.key} className="glass-panel h-full p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  {section.title}
                </p>
                {section.helper ? (
                  <p className="text-xs text-slate-400">{section.helper}</p>
                ) : null}
              </div>
              <span className="text-xs text-slate-400">LLM-guided</span>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-slate-100">
              {lines.map((line, idx) => (
                <li key={idx} className="rounded-md bg-white/5 px-3 py-2">
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

