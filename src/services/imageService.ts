import { apiClient } from './apiClient';
import { normalizeAssetUrl } from '../utils/url';

const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.heic',
  '.heif',
].join(',');

export type UploadedImage = {
  id: string;
  image_url: string;
  content_type: string;
  /** 옷 메타데이터 분석 완료 여부. false면 analyzeImage를 이어서 부른다. */
  analyzed?: boolean;
};

export async function listImages(): Promise<UploadedImage[]> {
  const response = await apiClient.get<UploadedImage[]>('/images');
  return response.data.map((image) => ({
    ...image,
    image_url: normalizeAssetUrl(image.image_url) ?? image.image_url,
  }));
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadedImage>('/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return {
    ...response.data,
    image_url: normalizeAssetUrl(response.data.image_url) ?? response.data.image_url,
  };
}

/**
 * 옷 메타데이터 분석을 요청한다. 업로드와 분리돼 있어 사용자를 기다리게 하지 않는다.
 * 서버리스는 응답 후 함수가 멈춰 서버측 백그라운드 작업을 신뢰할 수 없으므로,
 * 클라이언트가 별도 요청으로 이어서 태운다.
 */
export async function analyzeImage(imageId: string): Promise<UploadedImage> {
  const response = await apiClient.post<UploadedImage>(`/images/${imageId}/analyze`);
  return {
    ...response.data,
    image_url: normalizeAssetUrl(response.data.image_url) ?? response.data.image_url,
  };
}

/** 분석 요청을 띄우되 실패해도 화면 흐름을 막지 않는다. */
export function requestAnalysisInBackground(image: UploadedImage): void {
  if (image.analyzed) {
    return;
  }
  void analyzeImage(image.id).catch(() => {
    // 분석 실패는 추천 품질에만 영향을 준다. 업로드 자체는 이미 끝났다.
  });
}

export async function deleteImage(imageId: string): Promise<void> {
  await apiClient.delete(`/images/${imageId}`);
}

// 같은 사진을 두 번 올리는 것을 업로드 전에 걸러내기 위한 내용 지문.
// 백엔드도 같은 SHA-256으로 저장 경로를 정하므로 판정 기준이 서로 어긋나지 않는다.
export async function getImageFingerprint(file: File): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // 보안 컨텍스트가 아니면 Web Crypto가 없다. 파일 속성으로 대체한다.
    return `${file.name}:${file.size}:${file.lastModified}`;
  }

  try {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }
}

export function pickImageFile(): Promise<File | null> {
  return pickImageFiles(false).then((files) => files[0] ?? null);
}

export function pickImageFiles(multiple = true): Promise<File[]> {
  if (typeof document === 'undefined') {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    // image/* 는 OS의 MIME 등록에 기대다 보니 환경에 따라 webp/heic가 선택되지 않는다.
    // Gemini Vision이 실제로 받는 형식을 확장자까지 함께 명시한다.
    input.accept = ACCEPTED_IMAGE_TYPES;
    input.multiple = multiple;
    input.onchange = () => {
      resolve(Array.from(input.files ?? []));
    };
    // 아무것도 고르지 않고 닫으면 change가 오지 않으므로 창 포커스 복귀로 취소를 감지한다.
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => resolve(Array.from(input.files ?? [])), 300);
      },
      { once: true },
    );
    input.click();
  });
}
