import type { Product } from '../types/fashion';
import { apiClient } from './apiClient';

type ProductResponse = {
  id: string;
  brand: string;
  name: string;
  category: string;
  price: number | null;
  image_url: string | null;
  tags: string[];
};

function formatPrice(price: number | null): string {
  if (price === null) {
    return '가격 미정';
  }

  return `${price.toLocaleString('ko-KR')}원`;
}

export function mapProduct(product: ProductResponse, aiRecommended = false): Product {
  return {
    id: product.id,
    brand: product.brand,
    name: product.name,
    price: formatPrice(product.price),
    tags: product.tags,
    imageTone: '#f5f7fa',
    imageUrl: product.image_url,
    aiRecommended,
  };
}

export async function listProducts(query = '데일리'): Promise<Product[]> {
  const response = await apiClient.get<ProductResponse[]>('/products', {
    params: {
      q: query,
      limit: 10,
    },
  });

  return response.data.map((product, index) => mapProduct(product, index === 0));
}
