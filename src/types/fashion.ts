export type Product = {
  id: string;
  brand: string;
  name: string;
  price: string;
  tags: string[];
  imageTone: string;
  imageUrl?: string | null;
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
