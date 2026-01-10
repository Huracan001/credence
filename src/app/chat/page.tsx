"use client";

import { useState, useRef, useEffect } from "react";
import { ModelViewer } from "@/components/ModelViewer";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AKASHI assistant. Ask me anything about Polymarket prediction markets, how they work, or specific markets you're interested in.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("[chat] Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again or rephrase your question.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4 border-b border-[#1a1f2e] pb-8 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent"></div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2 pt-4">
          <span className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse"></span>
          AI ASSISTANT
        </p>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-[#f0f0f0] md:text-5xl uppercase">
          ASK ABOUT POLYMARKET
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#6b7280]">
          Get instant answers about prediction markets, market mechanics, probability interpretation, and more.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Chat Messages */}
        <div className="glass-panel glow-border flex flex-col" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-[#00d9ff]/10 border border-[#00d9ff]/30 text-[#f0f0f0]"
                    : "bg-[#1a1f2e]/50 border border-[#1a1f2e] text-[#e0e0e0]"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs text-[#6b7280] mt-2 uppercase tracking-wider">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1a1f2e]/50 border border-[#1a1f2e] rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse"></span>
                  <span className="text-sm text-[#6b7280]">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#1a1f2e] p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Polymarket markets, probabilities, or how prediction markets work..."
                className="flex-1 bg-[#0f1419] border border-[#1a1f2e] rounded-lg px-4 py-3 text-sm text-[#f0f0f0] placeholder-[#6b7280] focus:outline-none focus:border-[#00d9ff]/50 focus:ring-1 focus:ring-[#00d9ff]/30 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="border-2 border-[#00d9ff] bg-[#0a0a0f] px-6 py-3 text-sm font-black tracking-wider text-[#00d9ff] uppercase transition-all hover:bg-[#00d9ff] hover:text-[#0a0a0f] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0a0a0f] disabled:hover:text-[#00d9ff]"
              >
                SEND
              </button>
            </form>
          </div>
        </div>

        {/* 3D Model Viewer */}
        <div className="glass-panel glow-border" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
          <div className="border-b border-[#1a1f2e] px-6 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2">
              <span className="w-1 h-4 bg-[#00d9ff]"></span>
              AKASHI MODEL
            </p>
          </div>
          <div className="p-4 h-[calc(100%-60px)]">
            <ModelViewer />
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 glow-border">
        <p className="text-sm font-black text-[#00d9ff] uppercase tracking-wider flex items-center gap-2 mb-3">
          <span className="w-1 h-4 bg-[#00d9ff]"></span>
          EXAMPLE QUESTIONS
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => setInput("How do prediction markets work?")}
            className="text-left text-sm text-[#6b7280] hover:text-[#00d9ff] transition-colors p-3 border border-[#1a1f2e] hover:border-[#00d9ff]/30 rounded-lg"
          >
            • How do prediction markets work?
          </button>
          <button
            onClick={() => setInput("What does a 60% probability mean?")}
            className="text-left text-sm text-[#6b7280] hover:text-[#00d9ff] transition-colors p-3 border border-[#1a1f2e] hover:border-[#00d9ff]/30 rounded-lg"
          >
            • What does a 60% probability mean?
          </button>
          <button
            onClick={() => setInput("How is liquidity calculated?")}
            className="text-left text-sm text-[#6b7280] hover:text-[#00d9ff] transition-colors p-3 border border-[#1a1f2e] hover:border-[#00d9ff]/30 rounded-lg"
          >
            • How is liquidity calculated?
          </button>
          <button
            onClick={() => setInput("What are belief shifts?")}
            className="text-left text-sm text-[#6b7280] hover:text-[#00d9ff] transition-colors p-3 border border-[#1a1f2e] hover:border-[#00d9ff]/30 rounded-lg"
          >
            • What are belief shifts?
          </button>
        </div>
      </div>
    </div>
  );
}
