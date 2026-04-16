import { NdaFieldsPayload } from "./nda-fields-mapper";

export interface ChatApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatApiResponse {
  reply: string;
  nda_fields: NdaFieldsPayload;
}

export async function sendChatMessage(
  messages: ChatApiMessage[],
  currentFields: NdaFieldsPayload,
): Promise<ChatApiResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const res = await fetch(`${apiUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, current_fields: currentFields }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Chat request failed (${res.status})`);
  }

  return res.json();
}
