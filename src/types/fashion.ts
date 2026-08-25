export type Product = {
  id: string;
  /** 카탈로그 상품 id. 화면용 id와 달리 좋아요를 가리키는 키로 쓴다. 없을 수 있다. */
  itemId?: string | null;
  source?: 'closet' | 'musinsa';
  brand: string;
  name: string;
  /** 카탈로그 분류. 홈 카테고리 칩이 이 값으로 타일을 거른다. */
  category: string;
  price: string;
  /** 포맷 전 가격. 좋아요 스냅숏은 숫자를 저장하므로 원본을 함께 들고 간다. */
  priceValue?: number | null;
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
    /** 합성하지 않은 원본 카탈로그 id. 좋아요 키를 만들 때 이것부터 본다. */
    itemId: string | null;
    source: 'closet' | 'musinsa';
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
