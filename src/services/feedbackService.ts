import { apiClient } from './apiClient';

export async function createFeedbackEvent(payload: {
  user_id?: string | null;
  recommendation_id?: string | null;
  product_id?: string | null;
  event_type: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await apiClient.post('/feedback/events', {
    metadata: {},
    ...payload,
  });
  return response.data;
}
