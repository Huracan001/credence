import { Market, BeliefShift } from "@/types";

// ElizaOS agent configuration for prediction market insights
export interface ElizaAgentConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

let elizaInitialized = false;

/**
 * Initialize ElizaOS agent for generating market insights
 * Uses OpenAI, Anthropic, or Google Gemini API directly with ElizaOS-style prompts
 */
export async function initializeElizaAgent(config?: ElizaAgentConfig): Promise<boolean> {
  // Check for any available API key
  const apiKey = config?.apiKey || 
    process.env.OPENAI_API_KEY || 
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    console.warn("[elizaAgent] No API key provided, ElizaOS agent will not be initialized");
    return false;
  }

  elizaInitialized = true;
  return true;
}

/**
 * Generate insight using ElizaOS-style agent with OpenAI/Anthropic/Google Gemini API
 */
export async function generateElizaInsight(
  market: Market,
  shift: BeliefShift | null,
  context: {
    news?: Array<{ title: string; snippet: string }>;
    tweets?: Array<{ text: string }>;
    webSearch?: Array<{ title: string; snippet: string }>;
  } = {},
): Promise<string | null> {
  if (!elizaInitialized) {
    const initialized = await initializeElizaAgent();
    if (!initialized) {
      return null;
    }
  }

  // Determine which API to use (priority: Google > Anthropic > OpenAI)
  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  const apiKey = googleApiKey || anthropicApiKey || openaiApiKey;
  if (!apiKey) {
    return null;
  }

  try {
    // Build context for ElizaOS-style prompt
    const systemPrompt = `You are an ElizaOS explanation agent for prediction markets. Your role is to translate market signals into cautious, neutral, analyst-grade narrative. Rules:
- Do NOT forecast or invent probabilities.
- Describe only observed changes and concrete signals.
- Tone: analytical, calm, non-sensational.
- Reference external context (news, social media) when available.
- Always include the market question in your explanation.`;

    const contextParts: string[] = [];
    
    if (context.news && context.news.length > 0) {
      contextParts.push(`Recent news: ${context.news.slice(0, 3).map(n => n.title).join("; ")}`);
    }
    
    if (context.tweets && context.tweets.length > 0) {
      contextParts.push(`Social discussion: ${context.tweets.slice(0, 3).map(t => t.text.substring(0, 100)).join("; ")}`);
    }
    
    if (context.webSearch && context.webSearch.length > 0) {
      contextParts.push(`Web research: ${context.webSearch[0].snippet.substring(0, 200)}`);
    }

    const userPrompt = `Market question: "${market.question}"
Current probability: ${Math.round(market.probability * 100)}%
${shift ? `Probability change: ${shift.delta > 0 ? "+" : ""}${(shift.delta * 100).toFixed(1)} percentage points` : ""}
${contextParts.length > 0 ? `\n\nContext:\n${contextParts.join("\n")}` : ""}

Provide a brief, analytical explanation of what this market signal indicates, focusing on observed changes only.`;

    let response: Response;
    let data: any;

    // Use Google Gemini API if available (priority)
    if (googleApiKey) {
      const model = process.env.GOOGLE_LARGE_MODEL || process.env.GOOGLE_SMALL_MODEL || "gemini-2.0-flash-001";
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userPrompt}`,
            }],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API returned ${response.status}`);
      }

      data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
    
    // Use Anthropic API if available
    if (anthropicApiKey) {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anthropicApiKey}`,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 500,
          messages: [
            { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API returned ${response.status}`);
      }

      data = await response.json();
      return data.content?.[0]?.text || null;
    }
    
    // Use OpenAI API as fallback
    if (openaiApiKey) {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}`);
      }

      data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }

    return null;
  } catch (err) {
    console.error("[elizaAgent] Failed to generate insight", err);
    return null;
  }
}
