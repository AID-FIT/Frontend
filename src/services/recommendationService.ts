import type { AppliedFilters, Recommendation } from '../types/fashion';
import { env } from '../config/env';
import { AI_REQUEST_TIMEOUT_MS, apiClient } from './apiClient';
import { SseParser } from './sse';
import { normalizeAssetUrl } from '../utils/url';

export type AgentRecommendationItem = {
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

export type AgentAppliedFilters = {
  category: string | null;
  mood: string | null;
  season: string | null;
  age_range: string | null;
  preferred_styles: string[];
  prompt: string;
  result_count: number;
};

export type AgentRecommendationResponse = {
  status: 'success' | 'empty' | 'error';
  message: string;
  recommendations: AgentRecommendationItem[];
  style_guide: {
    summary: string;
    tips: string[];
  } | null;
  applied_filters?: AgentAppliedFilters | null;
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

function mapAppliedFilters(filters: AgentAppliedFilters | null | undefined): AppliedFilters | null {
  if (!filters) {
    return null;
  }
  return {
    category: filters.category,
    mood: filters.mood,
    season: filters.season,
    ageRange: filters.age_range,
    preferredStyles: filters.preferred_styles ?? [],
    prompt: filters.prompt ?? '',
    resultCount: filters.result_count ?? 0,
  };
}

export function mapAgentRecommendation(response: AgentRecommendationResponse): Recommendation {
  const styleGuide = response.style_guide;
  const summary = styleGuide ? [response.message, ...styleGuide.tips].join('\n') : response.message;

  return {
    id: `rec_${Date.now()}`,
    title: styleGuide?.summary ?? response.message,
    summary,
    appliedFilters: mapAppliedFilters(response.applied_filters),
    tags: response.recommendations.slice(0, 3).map((item) => item.category ?? item.source),
    items: response.recommendations.map((item) => ({
      id: item.item_id ?? `${item.source}_${item.item_name ?? Date.now()}`,
      category: item.category ?? item.source,
      name: item.item_name ?? item.category ?? '추천 아이템',
      reason: item.reason,
      imageTone: '#f5f7fa',
      product: {
        id: item.item_id ?? `${item.source}_${item.item_name ?? Date.now()}`,
        itemId: item.item_id,
        source: item.source,
        brand: item.brand ?? item.source,
        price: item.price,
        imageUrl: normalizeAssetUrl(item.image_url),
        productUrl: item.product_url,
      },
    })),
  };
}

export async function createRecommendation(payload: RecommendationCreatePayload): Promise<Recommendation> {
  const response = await apiClient.post<AgentRecommendationResponse>('/recommendations', payload, {
    timeout: AI_REQUEST_TIMEOUT_MS,
  });
  return mapAgentRecommendation(response.data);
}

export async function getRecommendation(recommendationId: string): Promise<Recommendation> {
  const response = await apiClient.get<AgentRecommendationResponse>(`/recommendations/${recommendationId}`);
  return mapAgentRecommendation(response.data);
}

export type HomeRecommendationParams = {
  prompt?: string;
  refreshSeed?: number;
  category?: string;
  mood?: string;
  season?: string;
};

function homeQueryParams(params: HomeRecommendationParams): Record<string, string> {
  return {
    prompt: params.prompt ?? '',
    refresh_seed: String(params.refreshSeed ?? 0),
    category: params.category ?? '',
    mood: params.mood ?? '',
    season: params.season ?? '',
  };
}

export async function getHomeRecommendation(params: HomeRecommendationParams = {}): Promise<Recommendation> {
  const response = await apiClient.get<AgentRecommendationResponse>('/recommendations/home', {
    timeout: AI_REQUEST_TIMEOUT_MS,
    params: homeQueryParams(params),
  });
  return mapAgentRecommendation(response.data);
}

/** 에이전트가 지금 무엇을 하고 있는지. 한 노드가 끝날 때마다 하나씩 온다. */
export type AgentProgressStep = {
  node: string;
  label: string;
  detail: string | null;
};

/**
 * 진행 상황을 받으며 홈 추천을 가져온다.
 *
 * 스트리밍을 쓸 수 없는 환경(네이티브 RN에는 fetch 스트림이 없다)이면
 * 던진다. 호출부가 잡아서 `getHomeRecommendation`으로 폴백한다.
 */
export async function streamHomeRecommendation(
  params: HomeRecommendationParams,
  onStep: (step: AgentProgressStep) => void,
  signal?: AbortSignal,
): Promise<Recommendation> {
  const query = new URLSearchParams(homeQueryParams(params)).toString();
  const authorization = apiClient.defaults.headers.common.Authorization;

  const response = await fetch(`${env.apiBaseUrl}/recommendations/home/stream?${query}`, {
    headers: {
      Accept: 'text/event-stream',
      // EventSource는 커스텀 헤더를 못 보낸다. 토큰을 쿼리스트링에 실으면
      // 서버 로그와 브라우저 기록에 남으므로 fetch로 헤더에 담는다.
      ...(authorization ? { Authorization: String(authorization) } : {}),
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`home stream failed: ${response.status}`);
  }
  if (!response.body?.getReader) {
    throw new Error('streaming is not supported here');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();
  let recommendation: Recommendation | null = null;

  const handle = (event: unknown) => {
    if (!event || typeof event !== 'object') {
      return;
    }
    const payload = event as { type?: string; message?: string };
    if (payload.type === 'step') {
      onStep(payload as unknown as AgentProgressStep);
      return;
    }
    if (payload.type === 'error') {
      throw new Error(payload.message || '추천을 만드는 중에 문제가 생겼어요.');
    }
    if (payload.type === 'result') {
      recommendation = mapAgentRecommendation(payload as unknown as AgentRecommendationResponse);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    parser.push(decoder.decode(value, { stream: true })).forEach(handle);
  }
  parser.flush().forEach(handle);

  if (!recommendation) {
    // 서버가 진행만 보내고 끝났다. 화면이 로딩에 머물지 않도록 실패로 다룬다.
    throw new Error('home stream ended without a result');
  }
  return recommendation;
}
