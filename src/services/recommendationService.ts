import type { Recommendation } from '../types/fashion';
import { apiClient } from './apiClient';

type RecommendationResponse = Recommendation & {
  vlm_result: Record<string, unknown>;
};

export type RecommendationCreatePayload = {
  prompt: string;
  image_url: string;
  user_id?: string | null;
  context?: Record<string, unknown>;
};

export async function createRecommendation(payload: RecommendationCreatePayload): Promise<Recommendation> {
  const response = await apiClient.post<RecommendationResponse>('/recommendations', {
    context: {},
    ...payload,
  });
  return response.data;
}

export async function getRecommendation(recommendationId: string): Promise<Recommendation> {
  const response = await apiClient.get<RecommendationResponse>(`/recommendations/${recommendationId}`);
  return response.data;
}
