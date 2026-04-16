import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaForm from "@/components/NdaForm";
import { NdaFormData } from "@/lib/nda-types";

// next/navigation is used by NdaForm's parent pages; NdaForm itself doesn't use it,
// but we mock it globally in case any transitive import requires it.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderForm(onSubmit = jest.fn()) {
  render(<NdaForm onSubmit={onSubmit} />);
  return { onSubmit };
}

describe("NdaForm — rendering", () => {
  it("renders all three sections", () => {
    renderForm();
    expect(screen.getByText("Agreement Terms")).toBeInTheDocument();
    expect(screen.getByText("Party 1")).toBeInTheDocument();
    expect(screen.getByText("Party 2")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    renderForm();
    expect(
      screen.getByRole("button", { name: /Preview Agreement/i })
    ).toBeInTheDocument();
  });

  it("pre-fills purpose with the default value", () => {
    renderForm();
    const textarea = screen.getByRole("textbox", { name: /Purpose/i });
    expect((textarea as HTMLTextAreaElement).value).toContain(
      "Evaluating whether to enter"
    );
  });

  it("pre-fills effective date with today", () => {
    renderForm();
    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("effective-date") as HTMLInputElement;
    expect(dateInput.value).toBe(today);
  });

  it("has MNDA term 'expires' radio selected by default", () => {
    renderForm();
    // YearRadioRow renders a <button role="radio" aria-checked> for the expires option
    const radioBtn = screen.getByRole("radio", { name: /Expires after/i });
    expect(radioBtn.getAttribute("aria-checked")).toBe("true");
  });

  it("has confidentiality term 'expires' radio selected by default", () => {
    renderForm();
    // The radio for expires is the first conf-term radio
    const radio = document.getElementById("conf-term-expires") as HTMLInputElement;
    expect(radio).not.toBeNull();
    expect(radio.checked).toBe(true);
  });

  it("renders Party 1 and Party 2 company inputs", () => {
    renderForm();
    expect(screen.getByLabelText(/party1-company|Company/i, { selector: "#party1-company" })).toBeInTheDocument();
    expect(screen.getByLabelText(/party2-company|Company/i, { selector: "#party2-company" })).toBeInTheDocument();
  });
});

describe("NdaForm — accessibility", () => {
  it("all visible text inputs have an associated label (htmlFor/id pair)", () => {
    const { container } = render(<NdaForm onSubmit={jest.fn()} />);
    const inputs = container.querySelectorAll("input[id], textarea[id]");
    inputs.forEach((input) => {
      const id = input.getAttribute("id");
      if (!id || input.classList.contains("sr-only")) return;
      const label = container.querySelector(`label[for="${id}"]`);
      expect(label).not.toBeNull();
    });
  });

  it("required fields have aria markers or required attribute", () => {
    const { container } = render(<NdaForm onSubmit={jest.fn()} />);
    const purposeTextarea = container.querySelector("#purpose") as HTMLTextAreaElement;
    expect(purposeTextarea?.required).toBe(true);
  });
});

describe("NdaForm — interactions", () => {
  it("updates purpose when user types", async () => {
    const user = userEvent.setup();
    renderForm();
    const textarea = screen.getByRole("textbox", { name: /Purpose/i });
    await user.clear(textarea);
    await user.type(textarea, "Testing partnership");
    expect((textarea as HTMLTextAreaElement).value).toBe("Testing partnership");
  });

  it("updates governing law when user types", async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByLabelText(/Governing Law/i, {
      selector: "#governing-law",
    });
    await user.type(input, "Delaware");
    expect((input as HTMLInputElement).value).toBe("Delaware");
  });

  it("selects 'until terminated' MNDA term radio", async () => {
    const user = userEvent.setup();
    renderForm();
    const radio = screen.getByRole("radio", {
      name: /Continues until terminated/i,
    });
    await user.click(radio);
    expect((radio as HTMLInputElement).checked).toBe(true);
  });

  it("selects 'in perpetuity' confidentiality radio", async () => {
    const user = userEvent.setup();
    renderForm();
    const radio = screen.getByRole("radio", { name: /In perpetuity/i });
    await user.click(radio);
    expect((radio as HTMLInputElement).checked).toBe(true);
  });

  it("updates Party 1 company name", async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByLabelText(/Company/i, {
      selector: "#party1-company",
    });
    await user.type(input, "Acme Corp");
    expect((input as HTMLInputElement).value).toBe("Acme Corp");
  });

  it("updates Party 2 company name independently", async () => {
    const user = userEvent.setup();
    renderForm();
    const p1 = screen.getByLabelText(/Company/i, { selector: "#party1-company" });
    const p2 = screen.getByLabelText(/Company/i, { selector: "#party2-company" });
    await user.type(p1, "Party One");
    await user.type(p2, "Party Two");
    expect((p1 as HTMLInputElement).value).toBe("Party One");
    expect((p2 as HTMLInputElement).value).toBe("Party Two");
  });
});

describe("NdaForm — submission", () => {
  async function fillAndSubmit() {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<NdaForm onSubmit={onSubmit} />);

    // Agreement Terms
    const govLaw = screen.getByLabelText(/Governing Law/i, { selector: "#governing-law" });
    await user.type(govLaw, "Delaware");
    const jurisdiction = screen.getByLabelText(/Jurisdiction/i, { selector: "#jurisdiction" });
    await user.type(jurisdiction, "New Castle, DE");

    // Party 1
    await user.type(screen.getByLabelText(/Company/i, { selector: "#party1-company" }), "Acme Inc");
    await user.type(screen.getByLabelText(/Signatory Name/i, { selector: "#party1-name" }), "Alice");
    await user.type(screen.getByLabelText(/Title/i, { selector: "#party1-title" }), "CEO");
    await user.type(screen.getByLabelText(/Notice Address/i, { selector: "#party1-address" }), "alice@acme.com");

    // Party 2
    await user.type(screen.getByLabelText(/Company/i, { selector: "#party2-company" }), "Beta LLC");
    await user.type(screen.getByLabelText(/Signatory Name/i, { selector: "#party2-name" }), "Bob");
    await user.type(screen.getByLabelText(/Title/i, { selector: "#party2-title" }), "CTO");
    await user.type(screen.getByLabelText(/Notice Address/i, { selector: "#party2-address" }), "bob@beta.com");

    fireEvent.submit(screen.getByRole("button", { name: /Preview Agreement/i }).closest("form")!);

    return { onSubmit };
  }

  it("calls onSubmit when form is submitted", async () => {
    const { onSubmit } = await fillAndSubmit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("passes correct party1 company to onSubmit", async () => {
    const { onSubmit } = await fillAndSubmit();
    await waitFor(() => {
      const data: NdaFormData = onSubmit.mock.calls[0][0];
      expect(data.party1.company).toBe("Acme Inc");
    });
  });

  it("passes correct governing law to onSubmit", async () => {
    const { onSubmit } = await fillAndSubmit();
    await waitFor(() => {
      const data: NdaFormData = onSubmit.mock.calls[0][0];
      expect(data.governingLaw).toBe("Delaware");
    });
  });

  it("passes correct mndaTermType to onSubmit", async () => {
    const { onSubmit } = await fillAndSubmit();
    await waitFor(() => {
      const data: NdaFormData = onSubmit.mock.calls[0][0];
      expect(data.mndaTermType).toBe("expires");
    });
  });

  it("passes until_terminated when that radio is selected", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<NdaForm onSubmit={onSubmit} />);

    await user.click(
      screen.getByRole("radio", { name: /Continues until terminated/i })
    );

    // Fill required fields minimally
    await user.type(screen.getByLabelText(/Governing Law/i, { selector: "#governing-law" }), "NY");
    await user.type(screen.getByLabelText(/Jurisdiction/i, { selector: "#jurisdiction" }), "NY County");
    for (const id of ["party1-company","party1-name","party1-title","party1-address","party2-company","party2-name","party2-title","party2-address"]) {
      await user.type(document.getElementById(id)!, "x");
    }

    fireEvent.submit(screen.getByRole("button", { name: /Preview Agreement/i }).closest("form")!);
    await waitFor(() => {
      const data: NdaFormData = onSubmit.mock.calls[0][0];
      expect(data.mndaTermType).toBe("until_terminated");
    });
  });
});
