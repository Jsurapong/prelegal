import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SignInPromptModal from "../../components/SignInPromptModal";

describe("SignInPromptModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <SignInPromptModal isOpen={false} onClose={jest.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders modal content when isOpen is true", () => {
    render(<SignInPromptModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText("Save your progress")).toBeTruthy();
    expect(screen.getByText("Sign In")).toBeTruthy();
    expect(screen.getByText("Continue without saving")).toBeTruthy();
  });

  it("calls onClose when continue button is clicked", () => {
    const onClose = jest.fn();
    render(<SignInPromptModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Continue without saving"));
    expect(onClose).toHaveBeenCalled();
  });

  it("has a Sign In link to /login", () => {
    render(<SignInPromptModal isOpen={true} onClose={jest.fn()} />);
    const signInLink = screen.getByText("Sign In");
    expect(signInLink.closest("a")?.getAttribute("href")).toBe("/login");
  });
});
