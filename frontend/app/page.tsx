"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { GenericDocFields, mergeDocFields } from "@/lib/doc-types";
import { sendChatMessage, ChatApiMessage } from "@/lib/chat-api";
import {
  listDocuments,
  saveDocument,
  loadDocument,
  deleteDocument,
  DocumentSummary,
} from "@/lib/documents-api";
import { useAuth } from "@/lib/auth-context";
import ChatPanel, { Message } from "@/components/ChatPanel";
import DocPreviewPanel from "@/components/DocPreviewPanel";
import DocumentsSidebar from "@/components/DocumentsSidebar";
import SignInPromptModal from "@/components/SignInPromptModal";

const WELCOME_MESSAGE =
  "Hello! I'm your legal document assistant. What kind of agreement do you need? " +
  "I can help you with NDAs, cloud service agreements, data processing agreements, " +
  "partnership agreements, and more. Just tell me what you're looking for!";

const DOC_DISPLAY_NAMES: Record<string, string> = {
  mutual_nda: "Mutual NDA",
  cloud_service_agreement: "Cloud Service Agreement",
  design_partner_agreement: "Design Partner Agreement",
  sla: "Service Level Agreement",
  professional_services_agreement: "Professional Services Agreement",
  dpa: "Data Processing Agreement",
  partnership_agreement: "Partnership Agreement",
  software_license_agreement: "Software License Agreement",
  pilot_agreement: "Pilot Agreement",
  baa: "Business Associate Agreement",
  ai_addendum: "AI Addendum",
};

function deriveTitle(docType: string, fields: GenericDocFields): string {
  const displayName = DOC_DISPLAY_NAMES[docType] ?? docType;
  if (fields.party1_company && fields.party2_company)
    return `${fields.party1_company} / ${fields.party2_company} — ${displayName}`;
  if (fields.provider_company)
    return `${fields.provider_company} — ${displayName}`;
  if (fields.customer_company)
    return `${fields.customer_company} — ${displayName}`;
  return `${displayName} (Draft)`;
}

function toApiMessages(msgs: Message[]): ChatApiMessage[] {
  return msgs
    .filter(
      (m): m is Message & { role: "user" | "assistant" } =>
        m.role === "user" || m.role === "assistant",
    )
    .map((m) => ({ role: m.role, content: m.content }));
}

export default function DocumentChatPage() {
  const { token, email, isAuthenticated, logout } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [docFields, setDocFields] = useState<GenericDocFields>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");

  // Documents sidebar state
  const [savedDocs, setSavedDocs] = useState<DocumentSummary[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<number | null>(null);
  const activeDocumentIdRef = useRef<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Save mutex to prevent concurrent saves from creating duplicates
  const isSavingRef = useRef(false);

  // Sign-in prompt
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const hasShownSignInPrompt = useRef(false);

  // Load documents list when authenticated
  useEffect(() => {
    if (token) {
      listDocuments(token)
        .then(setSavedDocs)
        .catch(() => {});
    } else {
      setSavedDocs([]);
    }
  }, [token]);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const apiMessages = toApiMessages([...messages, userMsg]);

        const response = await sendChatMessage(
          apiMessages,
          documentType,
          docFields,
        );

        const assistantMsg: Message = {
          role: "assistant",
          content: response.reply,
        };
        const newMessages = [...messages, userMsg, assistantMsg];
        setMessages((prev) => [...prev, assistantMsg]);

        let newDocType = documentType;
        let newFields = docFields;

        // Update document type if the AI selected one
        if (response.document_type && response.document_type !== documentType) {
          newDocType = response.document_type;
          newFields = mergeDocFields({}, response.doc_fields);
          setDocumentType(newDocType);
          setDocFields(newFields);
        } else {
          newFields = mergeDocFields(docFields, response.doc_fields);
          setDocFields(newFields);
        }

        // Auto-save if authenticated and document type is set
        if (token && newDocType && !isSavingRef.current) {
          isSavingRef.current = true;
          const title = deriveTitle(newDocType, newFields);
          const apiMsgs = toApiMessages(newMessages);

          try {
            const saved = await saveDocument(token, {
              id: activeDocumentIdRef.current,
              title,
              document_type: newDocType,
              doc_fields: newFields,
              messages: apiMsgs,
            });
            activeDocumentIdRef.current = saved.id;
            setActiveDocumentId(saved.id);
            listDocuments(token).then(setSavedDocs).catch(() => {});
          } catch {
            // Silently handle save failure
          } finally {
            isSavingRef.current = false;
          }
        }

        // Show sign-in prompt once for unauthenticated users after first AI response
        if (!token && newDocType && !hasShownSignInPrompt.current) {
          hasShownSignInPrompt.current = true;
          setShowSignInPrompt(true);
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
    [messages, documentType, docFields, token],
  );

  const handleLoadDocument = useCallback(
    async (doc: DocumentSummary) => {
      if (!token) return;
      try {
        const detail = await loadDocument(token, doc.id);
        setMessages([
          { role: "assistant", content: WELCOME_MESSAGE },
          ...detail.messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ]);
        setDocumentType(detail.document_type);
        setDocFields(detail.doc_fields as GenericDocFields);
        setActiveDocumentId(detail.id);
        activeDocumentIdRef.current = detail.id;
        setSidebarOpen(false);
      } catch {
        // Silently handle — doc may have been deleted
      }
    },
    [token],
  );

  const handleNew = useCallback(() => {
    setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
    setDocumentType(null);
    setDocFields({});
    setActiveDocumentId(null);
    activeDocumentIdRef.current = null;
    setSidebarOpen(false);
  }, []);

  const handleDeleteDocument = useCallback(
    async (doc: DocumentSummary) => {
      if (!token) return;
      try {
        await deleteDocument(token, doc.id);
        setSavedDocs((prev) => prev.filter((d) => d.id !== doc.id));
        if (activeDocumentId === doc.id) {
          handleNew();
        }
      } catch {
        // Silently handle
      }
    },
    [token, activeDocumentId, handleNew],
  );

  return (
    <div className="min-h-screen flex flex-col bg-parchment-texture">
      {/* Header */}
      <header className="border-b border-navy/10 bg-white/60 backdrop-blur-sm shrink-0 no-pdf">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="lg:hidden p-1.5 -ml-1.5 text-navy/60 hover:text-navy transition-colors"
              aria-label="Toggle documents sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center">
              <span className="text-yellow-accent font-serif text-sm font-bold leading-none">
                P
              </span>
            </div>
            <span className="font-sans font-semibold text-navy tracking-tight">
              Prelegal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-sans text-navy/40 tracking-widest uppercase hidden sm:block">
              Legal Document Creator
            </span>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-sans text-navy/60 hidden sm:block">
                  {email}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-sans font-semibold text-gray-text hover:text-navy transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-sans font-semibold text-blue-primary hover:text-blue-primary/80 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
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

      {/* Three-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Documents sidebar */}
        <DocumentsSidebar
          documents={savedDocs}
          activeDocumentId={activeDocumentId}
          isAuthenticated={isAuthenticated}
          onSelect={handleLoadDocument}
          onNew={handleNew}
          onDelete={handleDeleteDocument}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

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

      {/* Sign-in prompt modal */}
      <SignInPromptModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
      />
    </div>
  );
}
