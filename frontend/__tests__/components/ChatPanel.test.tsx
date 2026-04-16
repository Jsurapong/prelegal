import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel, { Message } from "@/components/ChatPanel";

const welcome: Message = { role: "assistant", content: "Hello! How can I help?" };

describe("ChatPanel", () => {
  it("renders assistant messages", () => {
    render(
      <ChatPanel messages={[welcome]} isLoading={false} onSend={jest.fn()} />,
    );
    expect(screen.getByText("Hello! How can I help?")).toBeInTheDocument();
  });

  it("renders user messages", () => {
    const msgs: Message[] = [
      welcome,
      { role: "user", content: "I need an NDA" },
    ];
    render(
      <ChatPanel messages={msgs} isLoading={false} onSend={jest.fn()} />,
    );
    expect(screen.getByText("I need an NDA")).toBeInTheDocument();
  });

  it("renders system messages as centered text", () => {
    const msgs: Message[] = [
      { role: "system", content: "Error: something went wrong" },
    ];
    render(
      <ChatPanel messages={msgs} isLoading={false} onSend={jest.fn()} />,
    );
    expect(screen.getByText("Error: something went wrong")).toBeInTheDocument();
  });

  it("calls onSend when form is submitted", async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();

    render(
      <ChatPanel messages={[welcome]} isLoading={false} onSend={onSend} />,
    );

    const input = screen.getByPlaceholderText("Type your message…");
    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  it("clears input after sending", async () => {
    const user = userEvent.setup();

    render(
      <ChatPanel messages={[welcome]} isLoading={false} onSend={jest.fn()} />,
    );

    const input = screen.getByPlaceholderText("Type your message…");
    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(input).toHaveValue("");
  });

  it("does not call onSend with empty input", async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();

    render(
      <ChatPanel messages={[welcome]} isLoading={false} onSend={onSend} />,
    );

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables input and button while loading", () => {
    render(
      <ChatPanel messages={[welcome]} isLoading={true} onSend={jest.fn()} />,
    );

    const input = screen.getByPlaceholderText("Type your message…");
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("shows loading indicator while loading", () => {
    const { container } = render(
      <ChatPanel messages={[welcome]} isLoading={true} onSend={jest.fn()} />,
    );

    // Three animated dots
    const dots = container.querySelectorAll(".animate-bounce");
    expect(dots.length).toBe(3);
  });
});
