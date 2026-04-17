export interface ChatApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatApiResponse {
  reply: string;
  document_type: string | null;
  doc_fields: Record<string, string | null>;
}

export async function sendChatMessage(
  messages: ChatApiMessage[],
  documentType: string | null,
  currentFields: Record<string, string | null>,
): Promise<ChatApiResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const res = await fetch(`${apiUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      document_type: documentType,
      current_fields: currentFields,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Chat request failed (${res.status})`);
  }

  return res.json();
}
