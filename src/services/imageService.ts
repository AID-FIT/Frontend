import { apiClient } from './apiClient';

export type UploadedImage = {
  id: string;
  image_url: string;
  content_type: string;
};

export async function listImages(): Promise<UploadedImage[]> {
  const response = await apiClient.get<UploadedImage[]>('/images');
  return response.data;
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadedImage>('/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
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
