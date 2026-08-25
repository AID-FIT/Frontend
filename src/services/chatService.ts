import { AI_REQUEST_TIMEOUT_MS, apiClient } from './apiClient';
import type { AgentRecommendationResponse } from './recommendationService';

export type ChatRole = 'user' | 'assistant';

export type Conversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

// 옷장에서 가져온 옷은 보낼 때 id만 넘기지만, 히스토리를 다시 그릴 수 있도록
// 서버가 이만큼을 사용자 메시지에 남겨 준다. 나중에 그 옷을 지워도 말풍선은 남는다.
export type SelectedClosetItem = {
  closet_item_id: string;
  name: string | null;
  image_url: string | null;
  category: string | null;
};

// user 메시지는 payload에 첨부 이미지와 고른 옷이, assistant 메시지는 AgentResponse 전체가 들어온다.
export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  payload: Partial<AgentRecommendationResponse> & {
    image_urls?: string[];
    closet_items?: SelectedClosetItem[];
  };
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
  // 비우면 옷장 전체를 본다. 고르면 그 옷만 이번 질문의 범위가 된다.
  closetItemIds: string[] = [],
): Promise<SendMessageResult> {
  const response = await apiClient.post<SendMessageResult>(
    `/chats/${conversationId}/messages`,
    { query, image_urls: imageUrls, closet_item_ids: closetItemIds },
    { timeout: AI_REQUEST_TIMEOUT_MS },
  );
  return response.data;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await apiClient.delete(`/chats/${conversationId}`);
}

export async function deleteAllConversations(): Promise<void> {
  await apiClient.delete('/chats');
}
