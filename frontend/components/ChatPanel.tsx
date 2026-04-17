"use client";

import { useEffect, useRef, useState } from "react";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Props {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
}

export default function ChatPanel({ messages, isLoading, onSend }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevLoadingRef = useRef(isLoading);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-focus the textarea when AI response arrives (loading -> not loading)
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      textareaRef.current?.focus();
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    onSend(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;
      setInput("");
      onSend(text);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg, i) => {
          if (msg.role === "system") {
            return (
              <p key={i} className="text-center text-xs font-sans text-navy/40 py-1">
                {msg.content}
              </p>
            );
          }
          const isUser = msg.role === "user";
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-3 text-sm font-sans leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-navy text-white rounded-2xl rounded-tr-sm"
                    : "bg-parchment text-navy rounded-2xl rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-parchment rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-navy/30 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-navy/30 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-navy/30 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-navy/10 bg-white px-4 py-3 flex gap-2 items-end"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          placeholder="Type your message…"
          aria-label="Chat message"
          className="flex-1 resize-none border border-navy/20 rounded-lg px-3 py-2 text-sm font-sans text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="shrink-0 bg-[#753991] text-white font-sans font-semibold text-sm px-4 py-2 rounded-lg hover:bg-[#5e2c75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
