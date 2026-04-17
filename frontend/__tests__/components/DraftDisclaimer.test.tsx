import React from "react";
import { render, screen } from "@testing-library/react";
import DraftDisclaimer from "../../components/DraftDisclaimer";

describe("DraftDisclaimer", () => {
  it("renders the disclaimer text", () => {
    render(<DraftDisclaimer />);
    expect(screen.getByText(/drafts for reference only/i)).toBeTruthy();
    expect(screen.getByText(/Disclaimer:/i)).toBeTruthy();
  });

  it("renders with note role for accessibility", () => {
    render(<DraftDisclaimer />);
    expect(screen.getByRole("note")).toBeTruthy();
  });

  it("mentions consulting an attorney", () => {
    render(<DraftDisclaimer />);
    expect(screen.getByText(/qualified attorney/i)).toBeTruthy();
  });
});
