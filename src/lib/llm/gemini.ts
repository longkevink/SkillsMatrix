import "server-only";

import { executeChatTool, geminiToolDeclarations } from "@/src/lib/chat/tools";
import type { ChatTurn } from "@/src/lib/chat/types";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_TOOL_ROUNDS = 3;
const REQUEST_TIMEOUT_MS = 15000;

interface GeminiFunctionCall {
  name?: string;
  args?: unknown;
}

interface GeminiPart {
  text?: string;
  functionCall?: GeminiFunctionCall;
}

interface GeminiContent {
  role: "user" | "model";
  parts: Array<{ text?: string; functionCall?: GeminiFunctionCall; functionResponse?: { name: string; response: unknown } }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
}

export interface GenerateGeminiChatInput {
  message: string;
  history: ChatTurn[];
  allowPhoneNumbers: boolean;
}

export interface GenerateGeminiChatResult {
  answer: string;
  toolUsed?: string;
  resolutionMeta?: {
    inputTerm?: string | null;
    resolvedTerm?: string | null;
    confidence?: number;
    needsClarification?: boolean;
  };
}

const SYSTEM_INSTRUCTION = [
  "You are the Skills Manager scheduling assistant.",
  "Answer using tool results only for factual staffing/backfill information.",
  "Approved means only skill status Active.",
  "If a request needs one person approved across multiple shows simultaneously, use approved_staff_multi_show and return the intersection.",
  "Use query_skills for direct skills lookups by show, role, status, or person.",
  "Use backfill_insights to evaluate backfill gaps and recommended fill candidates.",
  "For questions like 'what show has the lowest backfill for TD', treat show as the program/workstream and use backfill_insights with a role filter across all shows.",
  "For questions about least/most active roles, coverage, or role-level comparisons, use role_coverage_analysis and consider all roles and all statuses in scope.",
  "When show/role resolution indicates low confidence or needs clarification, ask the clarification question before attempting final staffing answers.",
  "Best backfill means rank order from configured backfill preferences.",
  "Do not expose notes.",
  "Only include phone numbers when the user explicitly requests contact information.",
  "If data is unavailable, say so clearly and ask a focused follow-up question.",
  "When a response includes more than 2 people, list each person on their own line starting with '• '.",
  "If the show or role in a query is ambiguous or not an exact known name, call resolve_show_role_terms before using any data tool.",
  "For questions about staff who are not approved, blocked, or need retraining, use query_skills with the appropriate status: 'Refresh' for needs retraining, 'Training' for in progress, 'Red' for blocked.",
  "For follow-up questions that reference 'them', 'that show', 'the same role', or similar, infer the show and role from the most recent turn of conversation before querying.",
  "If a tool returns zero Active staff for a show and role, say 'There is currently no approved [role] for [show].' then offer the best backfill option if one exists.",
  "If a question is unrelated to staffing, crew scheduling, or backfill, respond: 'I can only help with staffing and scheduling questions.'",
  "Lead every response with the direct answer. Do not restate the question. Add supporting detail only if it helps clarify.",
].join(" ");

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return {
    apiKey,
    model,
  };
}

function toGeminiContents(history: ChatTurn[], message: string): GeminiContent[] {
  const historyContents: GeminiContent[] = history.slice(-12).map((turn) => ({
    role: turn.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: turn.content }],
  }));

  return [...historyContents, { role: "user", parts: [{ text: message }] }];
}

function coerceToolArgs(rawArgs: unknown) {
  if (typeof rawArgs === "string") {
    try {
      return JSON.parse(rawArgs) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (rawArgs && typeof rawArgs === "object") {
    return rawArgs as Record<string, unknown>;
  }

  return {};
}

async function callGemini(contents: GeminiContent[]) {
  const { apiKey, model } = getGeminiConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents,
        tools: [
          {
            functionDeclarations: geminiToolDeclarations,
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
        },
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${bodyText.slice(0, 500)}`);
    }

    return (await response.json()) as GeminiResponse;
  } finally {
    clearTimeout(timeout);
  }
}

function extractText(parts: GeminiPart[]) {
  return parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

export async function generateGeminiChatResponse(
  input: GenerateGeminiChatInput
): Promise<GenerateGeminiChatResult> {
  const contents = toGeminiContents(input.history, input.message);
  let lastToolUsed: string | undefined;
  let resolutionMeta: GenerateGeminiChatResult["resolutionMeta"];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await callGemini(contents);
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    const functionCalls = parts
      .map((part) => part.functionCall)
      .filter((call): call is GeminiFunctionCall => Boolean(call));

    if (functionCalls.length > 0) {
      for (const functionCall of functionCalls) {
        const toolName = functionCall.name?.trim();

        if (!toolName) {
          continue;
        }

        const toolArgs = coerceToolArgs(functionCall.args);
        const toolResult = await executeChatTool(toolName, toolArgs, {
          allowPhoneNumbers: input.allowPhoneNumbers,
        });

        if (toolName === "resolve_show_role_terms" && toolResult && typeof toolResult === "object") {
          const resultRecord = toolResult as Record<string, unknown>;
          const showResolution =
            resultRecord.showResolution && typeof resultRecord.showResolution === "object"
              ? (resultRecord.showResolution as Record<string, unknown>)
              : null;
          resolutionMeta = {
            inputTerm: (showResolution?.input as string | null | undefined) ?? null,
            resolvedTerm: (showResolution?.resolvedValue as string | null | undefined) ?? null,
            confidence: typeof resultRecord.confidence === "number" ? resultRecord.confidence : undefined,
            needsClarification:
              typeof resultRecord.needsClarification === "boolean"
                ? resultRecord.needsClarification
                : undefined,
          };
        }

        lastToolUsed = toolName;

        contents.push({
          role: "model",
          parts: [{ functionCall: { name: toolName, args: toolArgs } }],
        });

        contents.push({
          role: "user",
          parts: [{ functionResponse: { name: toolName, response: toolResult } }],
        });
      }

      continue;
    }

    const text = extractText(parts);
    if (text) {
      return {
        answer: text,
        toolUsed: lastToolUsed,
        resolutionMeta,
      };
    }
  }

  return {
    answer:
      "I couldn't complete that request yet. Please try again with the show and role names in the same message.",
    toolUsed: lastToolUsed,
    resolutionMeta,
  };
}
