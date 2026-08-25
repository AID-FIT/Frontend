import { apiClient } from './apiClient';

// GET /closet/items 응답. 백엔드 ClosetItemResponse와 같은 snake_case를 유지한다.
export type ClosetItem = {
  id: string;
  image_id: string;
  name: string;
  brand: string | null;
  price: number | null;
  category: string | null;
  sub_category: string | null;
  gender: string | null;
  image_url: string;
  product_url: string | null;
  color: string | null;
  material: string | null;
  fit: string | null;
  pattern: string | null;
  mood: string | null;
  sense_of_season: string | null;
  is_match: boolean;
};

export async function listClosetItems(): Promise<ClosetItem[]> {
  const response = await apiClient.get<ClosetItem[]>('/closet/items');
  return response.data;
}
