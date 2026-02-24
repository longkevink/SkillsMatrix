import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatInterface } from "@/src/components/dashboard/chat-interface";

const openChatMock = vi.hoisted(() => vi.fn());

vi.mock("@/src/components/chat/chat-window-provider", () => ({
  useChatWindow: () => ({
    openChat: (...args: unknown[]) => openChatMock(...args),
  }),
}));

afterEach(() => {
  cleanup();
  openChatMock.mockReset();
});

describe("ChatInterface launcher", () => {
  it("opens floating chat with typed prompt", () => {
    render(<ChatInterface snapshot={null} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Open chat with this prompt" }), {
      target: { value: "Who is the best backfill for Nightly News TD?" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Start chat" }));

    expect(openChatMock).toHaveBeenCalledWith({
      initialPrompt: "Who is the best backfill for Nightly News TD?",
    });
  });

  it("opens floating chat from quick action", () => {
    render(<ChatInterface snapshot={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Approved TDs" }));

    expect(openChatMock).toHaveBeenCalledWith({
      initialPrompt: "Give me a list of approved TDs for Nightly News.",
    });
  });
});
