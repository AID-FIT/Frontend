export type Product = {
  id: string;
  brand: string;
  name: string;
  price: string;
  tags: string[];
  imageTone: string;
  imageUrl?: string | null;
  /** 상품 페이지 주소. 카드를 누르면 여기로 이동한다. */
  productUrl?: string | null;
  aiRecommended?: boolean;
};

export type OutfitItem = {
  id: string;
  category: string;
  name: string;
  reason: string;
  imageTone: string;
  product?: {
    id: string;
    brand: string;
    price: number | null;
    imageUrl: string | null;
    productUrl: string | null;
  } | null;
};

export type Recommendation = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  items: OutfitItem[];
};

export type UserProfile = {
  name: string;
  ageRange: string;
  styles: string[];
};
