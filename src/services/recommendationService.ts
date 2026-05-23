import type { Recommendation } from '../types/fashion';
import { apiClient } from './apiClient';
import { normalizeAssetUrl } from '../utils/url';

type AgentRecommendationItem = {
  item_id: string | null;
  source: 'closet' | 'musinsa';
  item_name: string | null;
  brand: string | null;
  category: string | null;
  image_url: string;
  product_url: string | null;
  price: number | null;
  reason: string;
};

type AgentRecommendationResponse = {
  status: 'success' | 'empty' | 'error';
  message: string;
  recommendations: AgentRecommendationItem[];
  style_guide: {
    summary: string;
    tips: string[];
  } | null;
};

type ClosetItemPayload = {
  closet_item_id: string;
  category?: string | null;
  color?: string | null;
  material?: string | null;
  fit?: string | null;
  pattern?: string | null;
  mood?: string | null;
  sense_of_season?: string | null;
};

export type RecommendationCreatePayload = {
  user_id: string;
  query: string;
  image_urls?: string[];
  closet_items?: ClosetItemPayload[];
  use_closet_style?: boolean;
  user_profile?: {
    age_group?: string | null;
    preferred_styles: string[];
  } | null;
};

function mapAgentRecommendation(response: AgentRecommendationResponse): Recommendation {
  const styleGuide = response.style_guide;
  const summary = styleGuide ? [response.message, ...styleGuide.tips].join('\n') : response.message;

  return {
    id: `rec_${Date.now()}`,
    title: styleGuide?.summary ?? response.message,
    summary,
    tags: response.recommendations.slice(0, 3).map((item) => item.category ?? item.source),
    items: response.recommendations.map((item) => ({
      id: item.item_id ?? `${item.source}_${item.item_name ?? Date.now()}`,
      category: item.category ?? item.source,
      name: item.item_name ?? item.category ?? '추천 아이템',
      reason: item.reason,
      imageTone: '#f5f7fa',
      product: {
        id: item.item_id ?? `${item.source}_${item.item_name ?? Date.now()}`,
        brand: item.brand ?? item.source,
        price: item.price,
        imageUrl: normalizeAssetUrl(item.image_url),
      },
    })),
  };
}

export async function createRecommendation(payload: RecommendationCreatePayload): Promise<Recommendation> {
  const response = await apiClient.post<AgentRecommendationResponse>('/recommendations', payload);
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
