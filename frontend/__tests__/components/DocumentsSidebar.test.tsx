import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DocumentsSidebar from "../../components/DocumentsSidebar";
import { DocumentSummary } from "../../lib/documents-api";

const mockDocs: DocumentSummary[] = [
  { id: 1, title: "Acme / Beta — Mutual NDA", document_type: "mutual_nda", updated_at: "2026-04-17 10:00:00" },
  { id: 2, title: "CloudCo — SLA", document_type: "sla", updated_at: "2026-04-16 08:00:00" },
];

const defaultProps = {
  documents: mockDocs,
  activeDocumentId: null as number | null,
  isAuthenticated: true,
  onSelect: jest.fn(),
  onNew: jest.fn(),
  onDelete: jest.fn(),
  isOpen: false,
  onClose: jest.fn(),
};

describe("DocumentsSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders document titles", () => {
    render(<DocumentsSidebar {...defaultProps} />);
    expect(screen.getByText("Acme / Beta — Mutual NDA")).toBeTruthy();
    expect(screen.getByText("CloudCo — SLA")).toBeTruthy();
  });

  it("calls onSelect when a document is clicked", () => {
    render(<DocumentsSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText("Acme / Beta — Mutual NDA"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockDocs[0]);
  });

  it("calls onNew when New button is clicked", () => {
    render(<DocumentsSidebar {...defaultProps} />);
    // There may be two "+ New" buttons (desktop + mobile), click the first visible one
    const newButtons = screen.getAllByText("+ New");
    fireEvent.click(newButtons[0]);
    expect(defaultProps.onNew).toHaveBeenCalled();
  });

  it("shows empty state when no documents", () => {
    render(<DocumentsSidebar {...defaultProps} documents={[]} />);
    expect(screen.getByText(/No documents yet/i)).toBeTruthy();
  });

  it("shows sign-in prompt when not authenticated", () => {
    render(<DocumentsSidebar {...defaultProps} isAuthenticated={false} documents={[]} />);
    expect(screen.getByText(/Sign in to save/i)).toBeTruthy();
  });

  it("renders My Documents header", () => {
    render(<DocumentsSidebar {...defaultProps} />);
    expect(screen.getAllByText("My Documents").length).toBeGreaterThan(0);
  });
});
