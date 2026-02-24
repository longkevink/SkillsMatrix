export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}
