import { env } from '../config/env';

const LEGACY_API_ORIGINS = [
  'http://devse.kr:12570',
  'https://devse.kr:12570',
];

function getApiOrigin(): string | null {
  try {
    return new URL(env.apiBaseUrl).origin;
  } catch {
    return null;
  }
}

export function normalizeAssetUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return url;
  }

  const legacyOrigin = LEGACY_API_ORIGINS.find((origin) => url.startsWith(origin));
  if (!legacyOrigin) {
    return url;
  }

  return `${apiOrigin}${url.slice(legacyOrigin.length)}`;
}
