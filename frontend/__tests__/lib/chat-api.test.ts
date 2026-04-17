import { sendChatMessage, ChatApiMessage, ChatApiResponse } from "../../lib/chat-api";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("sendChatMessage", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Clear env var
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("sends correct request body with document_type and current_fields", async () => {
    const mockResponse: ChatApiResponse = {
      reply: "Hello!",
      document_type: "mutual_nda",
      doc_fields: { purpose: "testing" },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const messages: ChatApiMessage[] = [
      { role: "user", content: "I need an NDA" },
    ];

    const result = await sendChatMessage(messages, null, {});

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body.messages).toEqual(messages);
    expect(body.document_type).toBeNull();
    expect(body.current_fields).toEqual({});
    expect(result).toEqual(mockResponse);
  });

  it("sends document_type and current_fields when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          reply: "Got it!",
          document_type: "cloud_service_agreement",
          doc_fields: { provider_company: "Acme" },
        }),
    });

    await sendChatMessage(
      [{ role: "user", content: "Acme is the provider" }],
      "cloud_service_agreement",
      { effective_date: "2026-01-01" },
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.document_type).toBe("cloud_service_agreement");
    expect(body.current_fields).toEqual({ effective_date: "2026-01-01" });
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ detail: "AI service unavailable" }),
    });

    await expect(
      sendChatMessage([{ role: "user", content: "test" }], null, {}),
    ).rejects.toThrow("AI service unavailable");
  });
});
