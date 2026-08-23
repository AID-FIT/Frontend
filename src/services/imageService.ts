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
