import { apiClient } from './apiClient';

export type UserProfileResponse = {
  id: string;
  email: string | null;
  nickname: string;
  age_range: string | null;
  styles: string[];
  preferred_colors: string[];
  avoid_items: string[];
  sizes: Record<string, unknown>;
};

export type UserPreferenceUpdate = {
  age_range?: string | null;
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
