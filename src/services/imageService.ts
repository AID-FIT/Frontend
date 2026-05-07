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
  if (typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      resolve(input.files?.[0] ?? null);
    };
    input.click();
  });
}
