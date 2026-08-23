import axios, { AxiosError } from 'axios';
import { env } from '../config/env';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 8000,
});

/**
 * AI가 답을 만드는 요청용 타임아웃.
 * 추천 한 건은 Gemini 호출 여러 번을 거쳐 10초를 넘긴다. 기본 8초로는
 * 정상 응답이 오는 중에 요청이 끊겨 "답변을 받지 못했어요"가 뜬다.
 * 서버 함수 한도(60초)에 맞춘다.
 */
export const AI_REQUEST_TIMEOUT_MS = 60000;

export type NormalizedApiError = {
  status: number | null;
  message: string;
  detail?: unknown;
};

let unauthorizedHandler: (() => void) | null = null;

// 순환 참조를 피하기 위해 스토어가 직접 핸들러를 등록한다.
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function setApiAccessToken(accessToken: string | null) {
  if (accessToken) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}

function normalizeError(error: AxiosError): NormalizedApiError {
  const status = error.response?.status ?? null;
  const data = error.response?.data as { detail?: unknown; message?: unknown } | undefined;
  const detailMessage =
    typeof data?.detail === 'string'
      ? data.detail
      : typeof data?.message === 'string'
        ? data.message
        : null;
  const message =
    detailMessage ??
    (status === null
      ? '네트워크 연결을 확인해주세요.'
      : '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');

  return { status, message, detail: data?.detail };
}

// 백엔드는 refresh 토큰이 없으므로 401이면 세션을 정리하고 재로그인을 유도한다.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      unauthorizedHandler?.();
    }

    // 기존 호출부 호환을 위해 원본 에러를 유지하고 정규화 정보를 덧붙인다.
    (error as AxiosError & { normalized?: NormalizedApiError }).normalized = normalizeError(error);
    return Promise.reject(error);
  },
);
