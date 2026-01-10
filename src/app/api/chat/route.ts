import { NextRequest, NextResponse } from "next/server";
import { generateElizaInsight, initializeElizaAgent } from "@/lib/elizaos/agent";

export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Initialize ElizaOS agent
    await initializeElizaAgent();

    // Determine which API to use (priority: Google > Anthropic > OpenAI)
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    const apiKey = googleApiKey || anthropicApiKey || openaiApiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured. Please add an API key." },
        { status: 503 },
      );
    }

    // Build system prompt for Polymarket chat
    const systemPrompt = `You are an AI assistant for AKASHI, a platform that analyzes Polymarket prediction markets. Your role is to help users understand:

1. How prediction markets work
2. How to interpret market probabilities
3. What liquidity and volume mean
4. How belief shifts are detected
5. Market mechanics and terminology
6. Specific questions about markets on Polymarket

Guidelines:
- Be clear, concise, and helpful
- Use examples when explaining concepts
- Reference Polymarket specifically when relevant
- If asked about specific markets, explain how to find and interpret them
- Do NOT provide investment advice or predictions
- Focus on education and understanding market mechanics

Tone: Professional, friendly, and educational.`;

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-5) // Last 5 messages for context
      .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const userPrompt = conversationContext
      ? `${conversationContext}\n\nuser: ${message}\nassistant:`
      : `user: ${message}\nassistant:`;

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
            maxOutputTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API returned ${response.status}`);
      }

      data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return NextResponse.json({ response: content || "I apologize, but I couldn't generate a response." });
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
          max_tokens: 1000,
          messages: [
            { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API returned ${response.status}`);
      }

      data = await response.json();
      return NextResponse.json({ response: data.content?.[0]?.text || "I apologize, but I couldn't generate a response." });
    }

    // Use OpenAI API as fallback
    if (openaiApiKey) {
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-5).map((msg: { role: string; content: string }) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        { role: "user", content: message },
      ];

      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          temperature: 0.7,
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}`);
      }

      data = await response.json();
      return NextResponse.json({ response: data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response." });
    }

    return NextResponse.json(
      { error: "No AI service configured" },
      { status: 503 },
    );
  } catch (err) {
    console.error("[api/chat] failed", err);
    return NextResponse.json(
      { error: "Unable to process chat request right now." },
      { status: 500 },
    );
  }
}
