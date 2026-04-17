"use client";

import { useState, useCallback } from "react";
import { GenericDocFields, mergeDocFields } from "@/lib/doc-types";
import { sendChatMessage, ChatApiMessage } from "@/lib/chat-api";
import ChatPanel, { Message } from "@/components/ChatPanel";
import DocPreviewPanel from "@/components/DocPreviewPanel";

const WELCOME_MESSAGE =
  "Hello! I'm your legal document assistant. What kind of agreement do you need? " +
  "I can help you with NDAs, cloud service agreements, data processing agreements, " +
  "partnership agreements, and more. Just tell me what you're looking for!";

export default function DocumentChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [docFields, setDocFields] = useState<GenericDocFields>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const apiMessages: ChatApiMessage[] = [...messages, userMsg]
          .filter((m): m is Message & { role: "user" | "assistant" } =>
            m.role === "user" || m.role === "assistant"
          )
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await sendChatMessage(
          apiMessages,
          documentType,
          docFields,
        );

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.reply },
        ]);

        // Update document type if the AI selected one
        if (response.document_type && response.document_type !== documentType) {
          setDocumentType(response.document_type);
          // Clear stale fields from the previous document type
          setDocFields(mergeDocFields({}, response.doc_fields));
        } else {
          setDocFields((prev) => mergeDocFields(prev, response.doc_fields));
        }
      } catch (err) {
        const detail =
          err instanceof Error ? err.message : "Something went wrong.";
        setMessages((prev) => [
          ...prev,
          { role: "system", content: `Error: ${detail}` },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, documentType, docFields],
  );

  return (
    <div className="min-h-screen flex flex-col bg-parchment-texture">
      {/* Header */}
      <header className="border-b border-navy/10 bg-white/60 backdrop-blur-sm shrink-0 no-pdf">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center">
              <span className="text-brass-light font-serif text-sm font-bold leading-none">
                P
              </span>
            </div>
            <span className="font-sans font-semibold text-navy tracking-tight">
              Prelegal
            </span>
          </div>
          <span className="text-xs font-sans text-navy/40 tracking-widest uppercase hidden sm:block">
            Legal Document Creator
          </span>
        </div>
      </header>

      {/* Mobile tab switcher */}
      <div className="md:hidden flex border-b border-navy/10 bg-white shrink-0 no-pdf">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-2.5 text-xs font-sans font-semibold tracking-widest uppercase transition-colors ${
            activeTab === "chat"
              ? "text-navy border-b-2 border-navy"
              : "text-navy/40"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2.5 text-xs font-sans font-semibold tracking-widest uppercase transition-colors ${
            activeTab === "preview"
              ? "text-navy border-b-2 border-navy"
              : "text-navy/40"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 min-h-0">
        {/* Chat panel */}
        <div
          className={`w-full md:w-[42%] md:max-w-[520px] flex flex-col border-r border-navy/10 bg-white ${
            activeTab !== "chat" ? "hidden md:flex" : "flex"
          }`}
        >
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
          />
        </div>

        {/* Preview panel */}
        <div
          className={`w-full md:flex md:flex-col md:flex-1 bg-parchment ${
            activeTab !== "preview" ? "hidden md:flex" : "flex flex-col"
          }`}
        >
          <DocPreviewPanel documentType={documentType} fields={docFields} />
        </div>
      </div>
    </div>
  );
}
