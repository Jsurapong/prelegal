import React from "react";
import { render, screen } from "@testing-library/react";
import DocPreviewPanel from "../../components/DocPreviewPanel";

// Mock the dynamic PdfDownloadButton since it requires browser APIs
jest.mock("next/dynamic", () => {
  return () => {
    const MockPdfButton = () => <button>Download PDF</button>;
    MockPdfButton.displayName = "MockPdfButton";
    return MockPdfButton;
  };
});

// Mock TemplateRenderer
jest.mock("../../components/TemplateRenderer", () => {
  const MockRenderer = ({ docId, fields }: { docId: string; fields: Record<string, string> }) => (
    <div data-testid="template-renderer" data-doc-id={docId}>
      Template for {docId}
    </div>
  );
  MockRenderer.displayName = "MockTemplateRenderer";
  return { __esModule: true, default: MockRenderer };
});

describe("DocPreviewPanel", () => {
  it("renders waiting state when documentType is null", () => {
    render(<DocPreviewPanel documentType={null} fields={{}} />);
    expect(screen.getByText(/Chat with the assistant/i)).toBeTruthy();
  });

  it("renders NDA preview for mutual_nda document type", () => {
    render(
      <DocPreviewPanel
        documentType="mutual_nda"
        fields={{
          purpose: "Testing",
          effective_date: "2026-01-01",
        }}
      />,
    );
    // NdaPreview renders "Mutual Non-Disclosure Agreement"
    expect(screen.getByText("Mutual Non-Disclosure Agreement")).toBeTruthy();
  });

  it("renders template renderer for non-NDA document types", () => {
    render(
      <DocPreviewPanel
        documentType="cloud_service_agreement"
        fields={{ provider_company: "Acme" }}
      />,
    );
    expect(screen.getByTestId("template-renderer")).toBeTruthy();
    expect(screen.getByTestId("template-renderer").getAttribute("data-doc-id")).toBe(
      "cloud_service_agreement",
    );
  });

  it("renders Download PDF button when document type is set", () => {
    render(
      <DocPreviewPanel
        documentType="pilot_agreement"
        fields={{}}
      />,
    );
    expect(screen.getByText("Download PDF")).toBeTruthy();
  });
});
