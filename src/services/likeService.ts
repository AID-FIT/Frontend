import type { OutfitItem, Product } from '../types/fashion';
import { apiClient } from './apiClient';
import type { AgentRecommendationItem } from './recommendationService';
import { normalizeAssetUrl } from '../utils/url';

export type LikeSource = 'closet' | 'musinsa';

/** 좋아요를 누를 때 서버에 함께 넘기는 상품 정보. */
export type LikeableProduct = {
  item_id?: string | null;
  source: LikeSource;
  item_name?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  image_url?: string | null;
  product_url?: string | null;
};

export type ProductLike = {
  id: string;
  product_ref: string;
  source: LikeSource;
  name: string | null;
  brand: string | null;
  category: string | null;
  price: number | null;
  image_url: string | null;
  product_url: string | null;
  created_at: string;
};

/**
 * 상품을 가리키는 키. 서버(`product_ref_of`)와 순서가 같아야 한다.
 * 어긋나면 좋아요를 눌러도 하트가 채워지지 않는다.
 */
export function productRefOf(product: LikeableProduct): string | null {
  for (const candidate of [product.item_id, product.product_url, product.image_url]) {
    const value = String(candidate ?? '').trim();
    if (value) {
      return value;
    }
  }
  return null;
}

/**
 * 화면 모델을 요청 본문으로 옮긴다.
 *
 * 서버 스키마가 `extra="forbid"`라 모르는 필드가 하나만 섞여도 422다. 화면이
 * 들고 있는 객체를 그대로 넘기지 않고 여기를 반드시 거친다.
 */
export function productToLikeable(product: Product): LikeableProduct {
  return {
    item_id: product.itemId ?? null,
    // 홈 타일은 대부분 카탈로그 상품이다. 출처가 비어 있으면 그쪽으로 본다.
    source: product.source ?? 'musinsa',
    item_name: product.name,
    brand: product.brand,
    category: product.category,
    // product.price는 '59,000원' 같은 표시용 문자열이라 쓸 수 없다.
    price: product.priceValue ?? null,
    image_url: product.imageUrl ?? null,
    product_url: product.productUrl ?? null,
  };
}

export function outfitItemToLikeable(item: OutfitItem): LikeableProduct | null {
  if (!item.product) {
    return null;
  }

  return {
    item_id: item.product.itemId,
    source: item.product.source,
    item_name: item.name,
    category: item.category,
    brand: item.product.brand,
    price: item.product.price,
    image_url: item.product.imageUrl,
    product_url: item.product.productUrl,
  };
}

export function agentItemToLikeable(item: AgentRecommendationItem): LikeableProduct {
  return {
    item_id: item.item_id,
    source: item.source,
    item_name: item.item_name,
    brand: item.brand,
    category: item.category,
    price: item.price,
    // 홈·추천 경로는 이미 정규화된 주소를 보낸다. 여기서 날것을 보내면 같은
    // 상품인데 키가 갈라져 하트가 한쪽에서만 채워진다.
    image_url: normalizeAssetUrl(item.image_url),
    product_url: item.product_url,
  };
}

export async function likeProduct(product: LikeableProduct): Promise<ProductLike> {
  // PUT이라 같은 요청을 여러 번 보내도 결과가 같다.
  const response = await apiClient.put<ProductLike>('/likes', product);
  return response.data;
}

export async function unlikeProduct(productRef: string): Promise<void> {
  await apiClient.delete('/likes', { params: { product_ref: productRef } });
}

export async function listLikes(limit = 100): Promise<ProductLike[]> {
  const response = await apiClient.get<ProductLike[]>('/likes', { params: { limit } });
  return response.data;
}

export async function listLikedRefs(): Promise<string[]> {
  const response = await apiClient.get<{ product_refs: string[] }>('/likes/refs');
  return response.data.product_refs;
}
