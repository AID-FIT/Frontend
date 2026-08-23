import { AI_REQUEST_TIMEOUT_MS, apiClient } from './apiClient';
import type { AgentRecommendationResponse } from './recommendationService';

export type ChatRole = 'user' | 'assistant';

export type Conversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

// user 메시지는 payload에 첨부 이미지가, assistant 메시지는 AgentResponse 전체가 들어온다.
export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  payload: Partial<AgentRecommendationResponse> & { image_urls?: string[] };
  created_at: string;
};

type ChatMessageListResponse = {
  messages: ChatMessage[];
  next_cursor: string | null;
};

export type SendMessageResult = {
  conversation_id: string;
  user_message_id: string;
  assistant_message_id: string;
  response: AgentRecommendationResponse;
};

export async function createConversation(title?: string): Promise<Conversation> {
  const response = await apiClient.post<Conversation>('/chats', { title: title ?? null });
  return response.data;
}

export async function listConversations(): Promise<Conversation[]> {
  const response = await apiClient.get<Conversation[]>('/chats');
  return response.data;
}

export async function listMessages(
  conversationId: string,
  options: { limit?: number; cursor?: string } = {},
): Promise<ChatMessageListResponse> {
  const response = await apiClient.get<ChatMessageListResponse>(
    `/chats/${conversationId}/messages`,
    { params: { limit: options.limit, cursor: options.cursor } },
  );
  return response.data;
}

export async function sendMessage(
  conversationId: string,
  query: string,
  imageUrls: string[] = [],
): Promise<SendMessageResult> {
  const response = await apiClient.post<SendMessageResult>(
    `/chats/${conversationId}/messages`,
    { query, image_urls: imageUrls },
    { timeout: AI_REQUEST_TIMEOUT_MS },
  );
  return response.data;
}
