import {
  listDocuments,
  saveDocument,
  loadDocument,
  deleteDocument,
} from "../../lib/documents-api";

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.NEXT_PUBLIC_API_URL;
});

const TOKEN = "test-token";

describe("listDocuments", () => {
  it("sends GET with Authorization header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, title: "Test", document_type: "mutual_nda", updated_at: "2026-01-01" }],
    });
    const result = await listDocuments(TOKEN);
    expect(mockFetch.mock.calls[0][0]).toBe("/api/documents/");
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token");
    expect(result).toHaveLength(1);
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(listDocuments(TOKEN)).rejects.toThrow("401");
  });
});

describe("saveDocument", () => {
  it("sends POST with body and Authorization header", async () => {
    const payload = {
      title: "Test",
      document_type: "mutual_nda",
      doc_fields: { party1_company: "Acme" },
      messages: [{ role: "user" as const, content: "hi" }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, ...payload, updated_at: "2026-01-01" }),
    });
    const result = await saveDocument(TOKEN, payload);
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual(payload);
    expect(result.id).toBe(1);
  });
});

describe("loadDocument", () => {
  it("sends GET to correct URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 5, title: "Test", document_type: "sla", updated_at: "2026-01-01", doc_fields: {}, messages: [] }),
    });
    const result = await loadDocument(TOKEN, 5);
    expect(mockFetch.mock.calls[0][0]).toBe("/api/documents/5");
    expect(result.id).toBe(5);
  });
});

describe("deleteDocument", () => {
  it("sends DELETE to correct URL", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await deleteDocument(TOKEN, 3);
    expect(mockFetch.mock.calls[0][0]).toBe("/api/documents/3");
    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(deleteDocument(TOKEN, 99)).rejects.toThrow("404");
  });
});
