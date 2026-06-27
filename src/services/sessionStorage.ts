import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthUser } from './authService';

export type PersistedSession = {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  hasSeenOnboardingIntro: boolean;
  isOnboarded: boolean;
  selectedAge: string;
  preferredStyles: string[];
};

export const defaultSession: PersistedSession = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
  hasSeenOnboardingIntro: false,
  isOnboarded: false,
  selectedAge: '',
  preferredStyles: [],
};

// SecureStore 키는 영숫자/"."/"-"/"_"만 허용한다.
const TOKEN_KEY = 'aidfit_access_token';
const SESSION_KEY = 'aidfit_session';

const isWeb = Platform.OS === 'web';

function getWebItem(key: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setWebItem(key: string, value: string | null): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // 저장 실패는 세션 유지를 막지 않도록 무시한다.
  }
}

// 토큰은 민감 정보이므로 네이티브에서 SecureStore(키체인/키스토어)에 보관한다.
async function setSecureItem(key: string, value: string | null): Promise<void> {
  if (isWeb) {
    setWebItem(key, value);
    return;
  }
  if (value === null) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) {
    return getWebItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setStorageItem(key: string, value: string | null): Promise<void> {
  if (isWeb) {
    setWebItem(key, value);
    return;
  }
  if (value === null) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function getStorageItem(key: string): Promise<string | null> {
  if (isWeb) {
    return getWebItem(key);
  }
  return AsyncStorage.getItem(key);
}

export async function loadSession(): Promise<PersistedSession> {
  try {
    const [token, rawSession] = await Promise.all([
      getSecureItem(TOKEN_KEY),
      getStorageItem(SESSION_KEY),
    ]);
    const parsed = rawSession ? (JSON.parse(rawSession) as Partial<PersistedSession>) : {};
    return { ...defaultSession, ...parsed, accessToken: token ?? null };
  } catch {
    return defaultSession;
  }
}

export async function saveSession(session: PersistedSession): Promise<void> {
  const { accessToken, ...rest } = session;
  await Promise.all([
    setSecureItem(TOKEN_KEY, accessToken),
    setStorageItem(SESSION_KEY, JSON.stringify(rest)),
  ]);
}

export async function clearSession(): Promise<void> {
  await Promise.all([setSecureItem(TOKEN_KEY, null), setStorageItem(SESSION_KEY, null)]);
}
