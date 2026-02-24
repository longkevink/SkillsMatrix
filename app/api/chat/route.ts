import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { generateGeminiChatResponse } from "@/src/lib/llm/gemini";
import type { ChatTurn } from "@/src/lib/chat/types";
import { getAuthCookieName, verifySignedAuthToken } from "@/src/lib/auth-session";

interface RateLimitState {
  count: number;
  resetAt: number;
}

interface ConversationState {
  turns: ChatTurn[];
  updatedAt: number;
}

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  conversationId: z.string().trim().min(1).max(120).optional(),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 25;
const CONVERSATION_TTL_MS = 30 * 60_000;
const MAX_CONVERSATION_TURNS = 20;

const rateLimitStore = new Map<string, RateLimitState>();
const conversationStore = new Map<string, ConversationState>();

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}

function isExplicitPhoneRequest(message: string) {
  return /\b(phone|number|contact|call|dial)\b/i.test(message);
}

function pruneStores(now: number) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  for (const [key, value] of conversationStore.entries()) {
    if (now - value.updatedAt > CONVERSATION_TTL_MS) {
      conversationStore.delete(key);
    }
  }
}

function checkRateLimit(key: string, now: number) {
  const state = rateLimitStore.get(key);

  if (!state || state.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    } as const;
  }

  if (state.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((state.resetAt - now) / 1000),
    } as const;
  }

  state.count += 1;
  rateLimitStore.set(key, state);

  return {
    allowed: true,
    retryAfterSeconds: 0,
  } as const;
}

export async function POST(request: NextRequest) {
  const authCookie = request.cookies.get(getAuthCookieName())?.value;
  if (!authCookie || !(await verifySignedAuthToken(authCookie))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  pruneStores(now);

  const rateLimit = checkRateLimit(getClientKey(request), now);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many chat requests. Try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat payload." }, { status: 400 });
  }

  const conversationId = parsed.data.conversationId ?? randomUUID();
  const conversation = conversationStore.get(conversationId);
  const history = conversation?.turns ?? [];

  const startedAt = Date.now();

  try {
    const result = await generateGeminiChatResponse({
      message: parsed.data.message,
      history,
      allowPhoneNumbers: isExplicitPhoneRequest(parsed.data.message),
    });

    const updatedTurns = [
      ...history,
      { role: "user", content: parsed.data.message } satisfies ChatTurn,
      { role: "assistant", content: result.answer } satisfies ChatTurn,
    ].slice(-MAX_CONVERSATION_TURNS);

    conversationStore.set(conversationId, {
      turns: updatedTurns,
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      answer: result.answer,
      conversationId,
      meta: {
        toolUsed: result.toolUsed,
        latencyMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat API error", { message });

    const status = message.includes("GEMINI_API_KEY") ? 500 : 503;
    const clientMessage =
      status === 500
        ? "Assistant is not configured. Set GEMINI_API_KEY in the server environment."
        : "Assistant temporarily unavailable. Please try again.";

    return NextResponse.json({ error: clientMessage }, { status });
  }
}

export function __resetChatRouteStateForTests() {
  rateLimitStore.clear();
  conversationStore.clear();
}
