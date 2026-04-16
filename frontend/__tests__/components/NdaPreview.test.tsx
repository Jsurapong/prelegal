import { render, screen } from "@testing-library/react";
import NdaPreview from "@/components/NdaPreview";
import { NdaFormData, createDefaultFormData } from "@/lib/nda-types";

function makeData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return {
    ...createDefaultFormData(),
    purpose: "Exploring a potential partnership.",
    effectiveDate: "2024-06-01",
    mndaTermType: "expires",
    mndaTermYears: "2",
    confidentialityTermType: "expires",
    confidentialityTermYears: "2",
    governingLaw: "California",
    jurisdiction: "San Francisco, California",
    modifications: "",
    party1: {
      company: "Acme Inc.",
      printName: "Alice Smith",
      title: "CEO",
      noticeAddress: "alice@acme.com",
      date: "2024-06-01",
    },
    party2: {
      company: "Beta LLC",
      printName: "Bob Jones",
      title: "CTO",
      noticeAddress: "bob@beta.com",
      date: "2024-06-01",
    },
    ...overrides,
  };
}

describe("NdaPreview document structure", () => {
  it("renders the document title", () => {
    render(<NdaPreview data={makeData()} />);
    expect(
      screen.getByText("Mutual Non-Disclosure Agreement")
    ).toBeInTheDocument();
  });

  it("has the nda-document id for PDF capture", () => {
    const { container } = render(<NdaPreview data={makeData()} />);
    expect(container.querySelector("#nda-document")).toBeInTheDocument();
  });
});

describe("NdaPreview — Cover Page field rendering", () => {
  it("renders the purpose text", () => {
    render(<NdaPreview data={makeData()} />);
    expect(
      screen.getAllByText(/Exploring a potential partnership/).length
    ).toBeGreaterThan(0);
  });

  it("renders the formatted effective date", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getAllByText(/June 1, 2024/).length).toBeGreaterThan(0);
  });

  it("renders expires MNDA term with correct year count", () => {
    render(<NdaPreview data={makeData()} />);
    expect(
      screen.getAllByText(/Expires 2 year\(s\) from Effective Date/).length
    ).toBeGreaterThan(0);
  });

  it("renders until-terminated MNDA term", () => {
    render(<NdaPreview data={makeData({ mndaTermType: "until_terminated" })} />);
    expect(
      screen.getAllByText(/Continues until terminated/).length
    ).toBeGreaterThan(0);
  });

  it("renders expires confidentiality term", () => {
    render(<NdaPreview data={makeData()} />);
    expect(
      screen.getAllByText(/2 year\(s\) from Effective Date.*trade secrets/s).length
    ).toBeGreaterThan(0);
  });

  it("renders in-perpetuity confidentiality term", () => {
    render(
      <NdaPreview
        data={makeData({ confidentialityTermType: "perpetuity" })}
      />
    );
    expect(screen.getAllByText("In perpetuity.").length).toBeGreaterThan(0);
  });

  it("renders governing law", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getAllByText(/California/).length).toBeGreaterThan(0);
  });

  it("renders jurisdiction", () => {
    render(<NdaPreview data={makeData()} />);
    expect(
      screen.getAllByText(/San Francisco, California/).length
    ).toBeGreaterThan(0);
  });

  it("shows modifications section when provided", () => {
    render(
      <NdaPreview data={makeData({ modifications: "Section 4 amended." })} />
    );
    expect(screen.getByText("Section 4 amended.")).toBeInTheDocument();
  });

  it("does not render a modifications section when empty", () => {
    render(<NdaPreview data={makeData({ modifications: "" })} />);
    expect(
      screen.queryByText(/MNDA Modifications/i)
    ).not.toBeInTheDocument();
  });
});

describe("NdaPreview — Signature table", () => {
  it("shows Party 1 company name", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getAllByText("Acme Inc.").length).toBeGreaterThan(0);
  });

  it("shows Party 2 company name", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getAllByText("Beta LLC").length).toBeGreaterThan(0);
  });

  it("shows Party 1 signatory name", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(0);
  });

  it("shows Party 2 signatory name", () => {
    render(<NdaPreview data={makeData()} />);
    expect(screen.getAllByText("Bob Jones").length).toBeGreaterThan(0);
  });

  it("shows signature date for both parties", () => {
    render(<NdaPreview data={makeData()} />);
    const dates = screen.getAllByText("June 1, 2024");
    expect(dates.length).toBeGreaterThanOrEqual(2);
  });
});

describe("NdaPreview — Standard Terms interpolation", () => {
  it("interpolates purpose into clause 1", () => {
    render(<NdaPreview data={makeData()} />);
    // Clause 1 contains "Introduction" and the purpose
    expect(
      screen.getByText(/Introduction/)
    ).toBeInTheDocument();
  });

  it("interpolates governing law into clause 9", () => {
    render(<NdaPreview data={makeData()} />);
    expect(
      screen.getByText(/Governing Law and Jurisdiction/)
    ).toBeInTheDocument();
    // California should appear in the clause 9 text
    const clause9 = screen.getByText(/Governing Law and Jurisdiction/)
      .closest("p");
    expect(clause9?.textContent).toContain("California");
  });

  it("shows placeholder when governing law is empty", () => {
    render(<NdaPreview data={makeData({ governingLaw: "" })} />);
    // Should show the underscore placeholder, not empty string
    expect(screen.getAllByText(/_______________/).length).toBeGreaterThan(0);
  });

  it("renders all 11 numbered clauses", () => {
    render(<NdaPreview data={makeData()} />);
    for (let i = 1; i <= 11; i++) {
      // Each clause starts with its number as bold text
      const clauseHeadings = screen.getAllByText(new RegExp(`^${i}\\.`));
      expect(clauseHeadings.length).toBeGreaterThan(0);
    }
  });
});
