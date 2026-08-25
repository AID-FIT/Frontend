import { apiClient } from './apiClient';
import type { AuthUser } from './authService';

export type UserProfileResponse = {
  id: string;
  email: string | null;
  nickname: string;
  role: 'guest' | 'user' | string;
  age_range: string | null;
  // 서버가 정규화한 값이 온다: men | women | unisex.
  gender: string | null;
  height_cm: number | null;
  styles: string[];
  preferred_colors: string[];
  avoid_items: string[];
  sizes: Record<string, unknown>;
};

export function profileToAuthUser(profile: UserProfileResponse, provider = 'social'): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    nickname: profile.nickname,
    provider,
    role: profile.role,
  };
}

export type OnboardingCompletePayload = UserPreferenceUpdate & {
  closet_image_ids?: string[];
};

export type UserPreferenceUpdate = {
  age_range?: string | null;
  // 이 PATCH는 나머지 필드를 통째로 교체하지만, 성별과 키는 본문에 담긴
  // 경우에만 반영된다. 건드리지 않을 때는 키 자체를 빼면 된다.
  gender?: string | null;
  height_cm?: number | null;
  styles: string[];
  preferred_colors?: string[];
  avoid_items?: string[];
  sizes?: Record<string, unknown>;
};

export async function getMyProfile(): Promise<UserProfileResponse> {
  const response = await apiClient.get<UserProfileResponse>('/users/me');
  return response.data;
}

export async function updateMyPreferences(payload: UserPreferenceUpdate): Promise<UserProfileResponse> {
  const response = await apiClient.patch<UserProfileResponse>('/users/me/preferences', {
    preferred_colors: [],
    avoid_items: [],
    sizes: {},
    ...payload,
  });
  return response.data;
}

export async function completeOnboarding(payload: OnboardingCompletePayload): Promise<UserProfileResponse> {
  const response = await apiClient.post<UserProfileResponse>('/users/me/onboarding/complete', {
    preferred_colors: [],
    avoid_items: [],
    sizes: {},
    closet_image_ids: [],
    ...payload,
  });
  return response.data;
}
