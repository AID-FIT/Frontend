import type { Recommendation } from '../types/fashion';
import { apiClient } from './apiClient';
import { normalizeAssetUrl } from '../utils/url';

type AgentRecommendationItem = {
  item_id: string;
  source: string;
  item_name: string;
  brand: string;
  category: string;
  image_url: string | null;
  product_url: string | null;
  price: number | null;
  reason: string;
};

type AgentRecommendationResponse = {
  status: 'success' | 'fallback' | 'error';
  message: string;
  recommendations: AgentRecommendationItem[];
  style_guide: {
    summary: string;
    tips: string[];
  };
  vlm_result: Record<string, unknown> | null;
  request_id: string | null;
};

export type RecommendationCreatePayload = {
  prompt?: string;
  query?: string;
  image_url?: string | null;
  user_id?: string | null;
  closet_item_id?: string | null;
  recommendation_target?: string;
  context?: Record<string, unknown>;
};

function mapAgentRecommendation(response: AgentRecommendationResponse): Recommendation {
  return {
    id: response.request_id ?? `rec_${Date.now()}`,
    title: response.style_guide.summary,
    summary: [response.message, ...response.style_guide.tips].join('\n'),
    tags: response.recommendations.slice(0, 3).map((item) => item.category),
    items: response.recommendations.map((item) => ({
      id: item.item_id,
      category: item.category,
      name: item.item_name,
      reason: item.reason,
      imageTone: '#f5f7fa',
      product: {
        id: item.item_id,
        brand: item.brand,
        price: item.price,
        imageUrl: normalizeAssetUrl(item.image_url),
      },
    })),
  };
}

export async function createRecommendation(payload: RecommendationCreatePayload): Promise<Recommendation> {
  const response = await apiClient.post<AgentRecommendationResponse>('/recommendations', {
    context: {},
    recommendation_target: 'musinsa',
    ...payload,
    query: payload.query ?? payload.prompt,
  });
  return mapAgentRecommendation(response.data);
}

export async function getRecommendation(recommendationId: string): Promise<Recommendation> {
  const response = await apiClient.get<AgentRecommendationResponse>(`/recommendations/${recommendationId}`);
  return mapAgentRecommendation(response.data);
}

export async function getHomeRecommendation(prompt = '', refreshSeed = 0): Promise<Recommendation> {
  const response = await apiClient.get<AgentRecommendationResponse>('/recommendations/home', {
    params: {
      prompt,
      refresh_seed: refreshSeed,
    },
  });
  return mapAgentRecommendation(response.data);
}
