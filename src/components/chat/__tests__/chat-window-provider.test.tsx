import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatWindowProvider, useChatWindow } from "@/src/components/chat/chat-window-provider";

function Harness() {
  const { openChat } = useChatWindow();

  return (
    <button
      type="button"
      onClick={() =>
        openChat({
          initialPrompt: "Who is the best backfill for Nightly News TD?",
        })
      }
    >
      Launch Chat
    </button>
  );
}

function renderShell(pageText: string) {
  return (
    <ChatWindowProvider>
      <div>{pageText}</div>
      <Harness />
    </ChatWindowProvider>
  );
}

describe("ChatWindowProvider", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "Top ranked backfill is Ava Brooks.",
          conversationId: "conversation-1",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("opens global chat window and sends initial prompt", async () => {
    render(renderShell("Dashboard"));

    fireEvent.click(screen.getByRole("button", { name: "Launch Chat" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    expect(screen.getAllByRole("dialog", { name: "AI Scheduling Assistant Chat" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Top ranked backfill is Ava Brooks.").length).toBeGreaterThan(0);
  });

  it("keeps chat state when layout children rerender", async () => {
    const { rerender } = render(renderShell("Dashboard"));

    fireEvent.click(screen.getByRole("button", { name: "Launch Chat" }));

    await waitFor(() => {
      expect(screen.getAllByText("Top ranked backfill is Ava Brooks.").length).toBeGreaterThan(0);
    });

    rerender(renderShell("Matrix"));

    expect(screen.getByText("Matrix")).toBeInTheDocument();
    expect(screen.getAllByText("Top ranked backfill is Ava Brooks.").length).toBeGreaterThan(0);
  });
});
