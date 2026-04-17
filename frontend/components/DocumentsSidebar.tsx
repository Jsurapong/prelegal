"use client";

import { DocumentSummary } from "@/lib/documents-api";

interface Props {
  documents: DocumentSummary[];
  activeDocumentId: number | null;
  isAuthenticated: boolean;
  onSelect: (doc: DocumentSummary) => void;
  onNew: () => void;
  onDelete: (doc: DocumentSummary) => void;
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + "Z").getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DocumentsSidebar({
  documents,
  activeDocumentId,
  isAuthenticated,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onClose,
}: Props) {
  const content = (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#032147]/10 flex items-center justify-between shrink-0">
        <span className="text-xs font-sans font-semibold tracking-widest uppercase text-[#032147]/50">
          My Documents
        </span>
        <button
          onClick={onNew}
          className="text-xs font-sans font-semibold text-white bg-[#032147] px-3 py-1 rounded-md hover:bg-[#032147]/80 transition-colors"
        >
          + New
        </button>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        {!isAuthenticated ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-sans text-[#888888]">
              Sign in to save and access your documents
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-sans text-[#888888]">
              No documents yet. Start a conversation to create one.
            </p>
          </div>
        ) : (
          <div className="py-1">
            {documents.map((doc) => {
              const isActive = doc.id === activeDocumentId;
              return (
                <div
                  key={doc.id}
                  className="group relative"
                >
                  <button
                    onClick={() => onSelect(doc)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      isActive
                        ? "bg-[#209dd7]/10 border-l-2 border-[#209dd7]"
                        : "hover:bg-[#032147]/5 border-l-2 border-transparent"
                    }`}
                  >
                    <p
                      className={`text-sm font-sans truncate ${
                        isActive ? "text-[#209dd7] font-semibold" : "text-[#032147]"
                      }`}
                    >
                      {doc.title}
                    </p>
                    <p className="text-xs font-sans text-[#888888] mt-0.5">
                      {timeAgo(doc.updated_at)}
                    </p>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#888888] hover:text-red-500 transition-all p-1"
                    aria-label={`Delete ${doc.title}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-60 border-r border-[#032147]/10 shrink-0 flex-col">
        {content}
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[80vw] shadow-xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
