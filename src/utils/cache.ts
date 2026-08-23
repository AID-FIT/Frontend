import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type CacheEntry<T> = {
  savedAt: number;
  value: T;
};

const isWeb = Platform.OS === 'web';

async function readRaw(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeRaw(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    await AsyncStorage.setItem(key, value);
  } catch {
    // 캐시 저장 실패가 화면 동작을 막지 않도록 무시한다.
  }
}

/** 유효기간이 지나지 않은 캐시만 돌려준다. 없거나 만료면 null. */
export async function readCache<T>(key: string, ttlMs: number): Promise<T | null> {
  const raw = await readRaw(key);
  if (!raw) {
    return null;
  }

  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (typeof entry?.savedAt !== 'number') {
      return null;
    }
    if (Date.now() - entry.savedAt > ttlMs) {
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  await writeRaw(key, JSON.stringify({ savedAt: Date.now(), value } satisfies CacheEntry<T>));
}
