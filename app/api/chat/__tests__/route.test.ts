import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const verifySignedAuthTokenMock = vi.hoisted(() => vi.fn(async () => true));
const generateGeminiChatResponseMock = vi.hoisted(() => vi.fn(async () => ({ answer: "Test reply", toolUsed: "approved_staff" })));

vi.mock("@/src/lib/auth-session", () => ({
  getAuthCookieName: () => "site_auth",
  verifySignedAuthToken: (...args: unknown[]) => verifySignedAuthTokenMock(...args),
}));

vi.mock("@/src/lib/llm/gemini", () => ({
  generateGeminiChatResponse: (...args: unknown[]) => generateGeminiChatResponseMock(...args),
}));

import { POST, __resetChatRouteStateForTests } from "@/app/api/chat/route";

function createRequest(body: unknown, options?: { cookie?: string; ip?: string }) {
  const headers = new Headers({
    "content-type": "application/json",
    "x-forwarded-for": options?.ip ?? "10.0.0.1",
  });

  if (options?.cookie !== "none") {
    headers.set("cookie", `site_auth=${options?.cookie ?? "valid-token"}`);
  }

  return new NextRequest("http://localhost:7333/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  verifySignedAuthTokenMock.mockReset();
  generateGeminiChatResponseMock.mockReset();
  verifySignedAuthTokenMock.mockResolvedValue(true);
  generateGeminiChatResponseMock.mockResolvedValue({ answer: "Test reply", toolUsed: "approved_staff" });
  __resetChatRouteStateForTests();
});

describe("POST /api/chat", () => {
  it("returns 401 when auth cookie is missing or invalid", async () => {
    verifySignedAuthTokenMock.mockResolvedValue(false);

    const response = await POST(createRequest({ message: "Who is approved?" }, { cookie: "bad-token" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(createRequest({ text: "wrong shape" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid chat payload." });
  });

  it("returns chat response payload when request succeeds", async () => {
    const response = await POST(createRequest({ message: "Give me approved TDs for Nightly News" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.answer).toBe("Test reply");
    expect(payload.meta.toolUsed).toBe("approved_staff");
    expect(typeof payload.conversationId).toBe("string");

    expect(generateGeminiChatResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Give me approved TDs for Nightly News",
      })
    );
  });

  it("returns 500 when Gemini key is not configured", async () => {
    generateGeminiChatResponseMock.mockRejectedValue(new Error("GEMINI_API_KEY is not configured."));

    const response = await POST(createRequest({ message: "Who is the best backfill for Nightly News TD?" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Assistant is not configured. Set GEMINI_API_KEY in the server environment.",
    });
  });
});
