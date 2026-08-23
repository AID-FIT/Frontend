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
  /** AI가 이 상품을 고른 이유. 없으면 카드에 표시하지 않는다. */
  reason?: string | null;
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

/** 이번 추천에 실제로 걸린 조건. 결과가 왜 이런지 화면에서 되짚기 위한 것이다. */
export type AppliedFilters = {
  category: string | null;
  mood: string | null;
  season: string | null;
  ageRange: string | null;
  preferredStyles: string[];
  prompt: string;
  resultCount: number;
};

export type Recommendation = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  items: OutfitItem[];
  appliedFilters?: AppliedFilters | null;
};

export type UserProfile = {
  name: string;
  ageRange: string;
  styles: string[];
};
