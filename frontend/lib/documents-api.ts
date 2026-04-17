import { ChatApiMessage } from "./chat-api";

export interface DocumentSummary {
  id: number;
  title: string;
  document_type: string;
  updated_at: string;
}

export interface DocumentDetail extends DocumentSummary {
  doc_fields: Record<string, string | null>;
  messages: ChatApiMessage[];
}

export interface SaveDocumentPayload {
  id?: number | null;
  title: string;
  document_type: string;
  doc_fields: Record<string, string | null>;
  messages: ChatApiMessage[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listDocuments(token: string): Promise<DocumentSummary[]> {
  const res = await fetch(`${API_URL}/api/documents/`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Failed to list documents (${res.status})`);
  }
  return res.json();
}

export async function saveDocument(
  token: string,
  payload: SaveDocumentPayload,
): Promise<DocumentDetail> {
  const res = await fetch(`${API_URL}/api/documents/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to save document (${res.status})`);
  }
  return res.json();
}

export async function loadDocument(
  token: string,
  id: number,
): Promise<DocumentDetail> {
  const res = await fetch(`${API_URL}/api/documents/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Failed to load document (${res.status})`);
  }
  return res.json();
}

export async function deleteDocument(
  token: string,
  id: number,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete document (${res.status})`);
  }
}
