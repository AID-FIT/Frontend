import { apiClient } from './apiClient';
import { normalizeAssetUrl } from '../utils/url';

export type UploadedImage = {
  id: string;
  image_url: string;
  content_type: string;
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
    input.accept = 'image/*';
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
