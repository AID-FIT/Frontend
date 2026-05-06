import { apiClient } from './apiClient';

export type AuthUser = {
  id: string;
  email: string | null;
  nickname: string;
  provider: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export async function loginWithGoogleIdToken(idToken: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/google', {
    id_token: idToken,
  });

  return response.data;
}

